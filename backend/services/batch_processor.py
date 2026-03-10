import asyncio
import datetime
import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from models.database import async_session
from models.tables import BatchJob, ModerationRecord, Policy
from services.moderation_agent import moderate_image, moderate_video_s3
from services.s3_client import download_file_bytes, list_media_files
from websocket.manager import manager

logger = logging.getLogger(__name__)

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
VIDEO_EXTS = {".mp4", ".mov", ".mkv"}

EXT_TO_MIME = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
}


async def start_batch(s3_bucket: str, s3_prefix: str, policy_id: int | None) -> str:
    """创建批量任务并在后台启动处理。"""
    batch_id = uuid.uuid4().hex[:12]

    async with async_session() as db:
        job = BatchJob(id=batch_id, s3_prefix=f"s3://{s3_bucket}/{s3_prefix}", policy_id=policy_id)
        db.add(job)
        await db.commit()

    asyncio.create_task(_run_batch(batch_id, s3_bucket, s3_prefix, policy_id))
    return batch_id


async def _run_batch(batch_id: str, bucket: str, prefix: str, policy_id: int | None):
    """后台协程，处理批量任务中的所有文件。"""
    try:
        files = await asyncio.to_thread(list_media_files, bucket, prefix)
    except Exception as e:
        logger.exception("批量任务 %s 列出 S3 文件失败", batch_id)
        await _update_job_status(batch_id, "failed", 0, 0)
        await manager.send_progress(batch_id, {"type": "error", "batch_id": batch_id, "error": str(e)})
        return

    total = len(files)
    await _update_job_status(batch_id, "processing", total, 0)
    await manager.send_progress(batch_id, {
        "type": "progress",
        "batch_id": batch_id,
        "processed": 0,
        "total": total,
    })

    # 一次性加载策略规则
    policy_rules: dict | None = None
    if policy_id:
        async with async_session() as db:
            policy = await db.get(Policy, policy_id)
            if policy:
                policy_rules = policy.rules

    sem = asyncio.Semaphore(settings.batch_concurrency)
    processed = 0
    lock = asyncio.Lock()

    async def process_one(file_info: dict):
        nonlocal processed
        async with sem:
            key = file_info["key"]
            ext = file_info["ext"]
            s3_uri = file_info["s3_uri"]
            fname = key.rsplit("/", 1)[-1]

            try:
                if ext in IMAGE_EXTS:
                    data = await asyncio.to_thread(download_file_bytes, bucket, key)
                    mime = EXT_TO_MIME.get(ext, "image/jpeg")
                    result = await asyncio.to_thread(moderate_image, data, mime, policy_rules)
                    media_type = "image"
                elif ext in VIDEO_EXTS:
                    result = await asyncio.to_thread(moderate_video_s3, s3_uri, policy_rules)
                    media_type = "video"
                else:
                    return

                # 保存审核记录
                async with async_session() as db:
                    rec = ModerationRecord(
                        file_name=fname,
                        file_type=media_type,
                        policy_id=policy_id,
                        result=result,
                        status="completed",
                        batch_id=batch_id,
                    )
                    db.add(rec)
                    await db.commit()

                async with lock:
                    processed += 1
                    current = processed

                await manager.send_progress(batch_id, {
                    "type": "result",
                    "batch_id": batch_id,
                    "processed": current,
                    "total": total,
                    "file_name": fname,
                    "result": result,
                })
            except Exception as e:
                logger.exception("批量处理项失败: %s", key)
                async with lock:
                    processed += 1
                    current = processed
                await manager.send_progress(batch_id, {
                    "type": "error",
                    "batch_id": batch_id,
                    "processed": current,
                    "total": total,
                    "file_name": fname,
                    "error": str(e),
                })

    tasks = [process_one(f) for f in files]
    await asyncio.gather(*tasks)

    await _update_job_status(batch_id, "completed", total, processed)
    await manager.send_progress(batch_id, {
        "type": "complete",
        "batch_id": batch_id,
        "processed": processed,
        "total": total,
    })


async def _update_job_status(batch_id: str, status: str, total: int, processed: int):
    async with async_session() as db:
        job = await db.get(BatchJob, batch_id)
        if job:
            job.status = status
            job.total_files = total
            job.processed_files = processed
            if status in ("completed", "failed"):
                job.completed_at = datetime.datetime.utcnow()
            await db.commit()

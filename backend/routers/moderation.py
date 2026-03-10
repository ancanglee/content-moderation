import asyncio
import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from models.database import async_session, get_db
from models.schemas import ModerationRecordResponse
from models.tables import ModerationRecord, Policy
from services.moderation_agent import moderate_image, moderate_video_s3
from services.s3_client import upload_to_temp
from utils.file_handler import classify_media, validate_upload

logger = logging.getLogger(__name__)
router = APIRouter()


async def _run_moderation(record_id: int, media: str, data: bytes, content_type: str,
                          s3_uri: str | None, policy_rules: dict | None):
    """后台异步执行审核，完成后更新数据库记录。"""
    try:
        if media == "image":
            result = await asyncio.to_thread(
                moderate_image, data, content_type, policy_rules
            )
        else:
            uri = s3_uri or ""
            result = await asyncio.to_thread(
                moderate_video_s3, uri, policy_rules
            )

        async with async_session() as db:
            record = await db.get(ModerationRecord, record_id)
            if record:
                record.result = result
                record.status = "completed"
                await db.commit()
        logger.info("审核完成: record_id=%d", record_id)
    except Exception as e:
        logger.exception("审核失败: record_id=%d", record_id)
        async with async_session() as db:
            record = await db.get(ModerationRecord, record_id)
            if record:
                record.result = {"error": str(e)}
                record.status = "failed"
                await db.commit()


@router.post("/upload")
async def upload_and_moderate(
    file: UploadFile = File(...),
    policy_id: int | None = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """上传文件，立即返回记录 ID，审核在后台异步执行。"""
    content_type = file.content_type or "application/octet-stream"
    data = await file.read()

    try:
        validate_upload(content_type, len(data))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 如果指定了策略则加载
    policy_rules: dict | None = None
    if policy_id:
        policy = await db.get(Policy, policy_id)
        if not policy:
            raise HTTPException(status_code=404, detail="策略不存在")
        policy_rules = policy.rules

    media = classify_media(content_type)

    # 视频需先上传到 S3
    s3_uri: str | None = None
    if media == "video":
        try:
            s3_uri = await asyncio.to_thread(
                upload_to_temp, file.filename or "video.mp4", data, content_type
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"视频上传 S3 失败: {e}")

    # 先保存记录（状态: processing），立即返回
    record = ModerationRecord(
        file_name=file.filename or "unknown",
        file_type=media,
        policy_id=policy_id,
        result={},
        status="processing",
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    # 后台异步执行审核
    asyncio.create_task(
        _run_moderation(record.id, media, data, content_type, s3_uri, policy_rules)
    )

    return {
        "record_id": record.id,
        "file_name": record.file_name,
        "file_type": media,
        "status": "processing",
    }


@router.get("/{record_id}", response_model=ModerationRecordResponse)
async def get_moderation_result(record_id: int, db: AsyncSession = Depends(get_db)):
    """查询审核结果（轮询接口）。"""
    record = await db.get(ModerationRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record

import asyncio
import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from models.database import get_db
from models.tables import ModerationRecord, Policy
from services.moderation_agent import moderate_image, moderate_video_s3
from services.s3_client import upload_to_temp
from utils.file_handler import classify_media, validate_upload

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/upload")
async def upload_and_moderate(
    file: UploadFile = File(...),
    policy_id: int | None = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """上传文件并执行审核。"""
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

    try:
        if media == "image":
            result = await asyncio.to_thread(
                moderate_image, data, content_type, policy_rules
            )
        else:
            # 视频: 先上传到临时 S3，再通过 S3 URI 审核
            s3_uri = await asyncio.to_thread(
                upload_to_temp, file.filename or "video.mp4", data, content_type
            )
            result = await asyncio.to_thread(
                moderate_video_s3, s3_uri, policy_rules
            )
    except Exception as e:
        logger.exception("审核失败")
        raise HTTPException(status_code=500, detail=str(e))

    # 保存审核记录
    record = ModerationRecord(
        file_name=file.filename or "unknown",
        file_type=media,
        policy_id=policy_id,
        result=result,
        status="completed",
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    return {
        "record_id": record.id,
        "file_name": record.file_name,
        "file_type": media,
        "result": result,
    }

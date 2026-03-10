import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.database import get_db
from models.schemas import BatchRequest, BatchStatusResponse
from models.tables import BatchJob
from services.batch_processor import start_batch

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/start")
async def create_batch(req: BatchRequest):
    """启动新的批量审核任务。"""
    try:
        batch_id = await start_batch(req.s3_bucket, req.s3_prefix, req.policy_id)
        return {"batch_id": batch_id}
    except Exception as e:
        logger.exception("批量任务启动失败")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=list[BatchStatusResponse])
async def list_batches(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BatchJob).order_by(BatchJob.created_at.desc()))
    return result.scalars().all()


@router.get("/{batch_id}", response_model=BatchStatusResponse)
async def get_batch(batch_id: str, db: AsyncSession = Depends(get_db)):
    job = await db.get(BatchJob, batch_id)
    if not job:
        raise HTTPException(status_code=404, detail="批量任务不存在")
    return job

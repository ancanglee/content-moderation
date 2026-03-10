from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.database import get_db
from models.schemas import ModerationRecordResponse
from models.tables import ModerationRecord

router = APIRouter()


@router.get("/", response_model=list[ModerationRecordResponse])
async def list_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    verdict: str | None = Query(None),
    file_type: str | None = Query(None),
    batch_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(ModerationRecord).order_by(ModerationRecord.created_at.desc())

    if verdict:
        # Filter on JSON field — SQLite JSON support via SQLAlchemy
        q = q.where(ModerationRecord.result["verdict"].as_string() == verdict)
    if file_type:
        q = q.where(ModerationRecord.file_type == file_type)
    if batch_id:
        q = q.where(ModerationRecord.batch_id == batch_id)

    q = q.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/stats")
async def stats(db: AsyncSession = Depends(get_db)):
    total_q = select(func.count()).select_from(ModerationRecord)
    total = (await db.execute(total_q)).scalar() or 0

    rows = (
        await db.execute(
            select(
                ModerationRecord.result["verdict"].as_string().label("verdict"),
                func.count().label("cnt"),
            )
            .group_by("verdict")
        )
    ).all()

    breakdown = {r.verdict: r.cnt for r in rows}
    return {"total": total, "breakdown": breakdown}

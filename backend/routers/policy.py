import asyncio
import datetime
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.database import get_db
from models.schemas import (
    PolicyCreateRequest,
    PolicyGenerateRequest,
    PolicyResponse,
    PolicyUpdateRequest,
)
from models.tables import Policy
from services.policy_agent import generate_policy

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=list[PolicyResponse])
async def list_policies(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Policy).order_by(Policy.created_at.desc()))
    return result.scalars().all()


@router.get("/{policy_id}", response_model=PolicyResponse)
async def get_policy(policy_id: int, db: AsyncSession = Depends(get_db)):
    policy = await db.get(Policy, policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="策略不存在")
    return policy


@router.post("/generate")
async def generate(req: PolicyGenerateRequest):
    """调用策略 Agent 生成新的审核策略（JSON 预览）。"""
    try:
        result = await asyncio.to_thread(
            generate_policy,
            req.industry,
            req.content_types,
            req.additional_requirements,
        )
        return result
    except Exception as e:
        logger.exception("策略生成失败")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=PolicyResponse)
async def create_policy(req: PolicyCreateRequest, db: AsyncSession = Depends(get_db)):
    policy = Policy(name=req.name, description=req.description, rules=req.rules)
    db.add(policy)
    await db.commit()
    await db.refresh(policy)
    return policy


@router.put("/{policy_id}", response_model=PolicyResponse)
async def update_policy(
    policy_id: int,
    req: PolicyUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """手工编辑策略（名称、描述、规则均可修改）。"""
    policy = await db.get(Policy, policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="策略不存在")
    if req.name is not None:
        policy.name = req.name
    if req.description is not None:
        policy.description = req.description
    if req.rules is not None:
        policy.rules = req.rules
    policy.updated_at = datetime.datetime.utcnow()
    await db.commit()
    await db.refresh(policy)
    return policy


@router.post("/{policy_id}/regenerate", response_model=PolicyResponse)
async def regenerate_policy(
    policy_id: int,
    req: PolicyGenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    """手工触发策略 Agent 重新生成规则，并更新已有策略。"""
    policy = await db.get(Policy, policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="策略不存在")
    try:
        new_rules = await asyncio.to_thread(
            generate_policy,
            req.industry,
            req.content_types,
            req.additional_requirements,
        )
    except Exception as e:
        logger.exception("策略重新生成失败")
        raise HTTPException(status_code=500, detail=str(e))

    policy.rules = new_rules
    policy.name = new_rules.get("policy_name", policy.name)
    policy.description = new_rules.get("description", policy.description)
    policy.updated_at = datetime.datetime.utcnow()
    await db.commit()
    await db.refresh(policy)
    return policy


@router.delete("/{policy_id}")
async def delete_policy(policy_id: int, db: AsyncSession = Depends(get_db)):
    policy = await db.get(Policy, policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="策略不存在")
    await db.delete(policy)
    await db.commit()
    return {"ok": True}

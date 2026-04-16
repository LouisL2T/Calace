import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_tenant_id
from app.db.session import get_db
from app.models.color_rule import ColorRule
from app.models.user import User
from app.schemas.color_rule import ColorRuleCreate, ColorRuleUpdate, ColorRuleResponse

router = APIRouter(prefix="/color-rules", tags=["color-rules"])


@router.get("", response_model=list[ColorRuleResponse])
async def list_color_rules(
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ColorRule)
        .where(ColorRule.tenant_id == tenant_id)
        .order_by(ColorRule.rule_type, ColorRule.label)
    )
    return result.scalars().all()


@router.post("", response_model=ColorRuleResponse)
async def create_color_rule(
    data: ColorRuleCreate,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    rule = ColorRule(tenant_id=tenant_id, **data.model_dump())
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule


@router.put("/{rule_id}", response_model=ColorRuleResponse)
async def update_color_rule(
    rule_id: uuid.UUID,
    data: ColorRuleUpdate,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ColorRule).where(
            ColorRule.id == rule_id,
            ColorRule.tenant_id == tenant_id,
        )
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(rule, field, value)

    await db.commit()
    await db.refresh(rule)
    return rule


@router.delete("/{rule_id}")
async def delete_color_rule(
    rule_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ColorRule).where(
            ColorRule.id == rule_id,
            ColorRule.tenant_id == tenant_id,
        )
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404)
    await db.delete(rule)
    await db.commit()
    return {"ok": True}

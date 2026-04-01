import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_tenant_id
from app.db.session import get_db
from app.models.modules import TenantModule, ModuleDefinition

router = APIRouter(prefix="/modules", tags=["modules"])


@router.get("/active")
async def get_active_modules(
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Return all active modules for the current tenant – used by frontend to dynamically load UI."""
    result = await db.execute(
        select(ModuleDefinition, TenantModule.config)
        .join(TenantModule, TenantModule.module_id == ModuleDefinition.id)
        .where(TenantModule.tenant_id == tenant_id, TenantModule.is_active.is_(True))
        .order_by(ModuleDefinition.sort_order)
    )
    modules = []
    for mod, config in result.all():
        modules.append({
            "slug": mod.slug,
            "name": mod.name,
            "description": mod.description,
            "icon": mod.icon,
            "category": mod.category,
            "component_path": mod.component_path,
            "config": config,
            "is_builtin": mod.is_builtin,
        })
    return modules

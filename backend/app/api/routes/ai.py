import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_tenant_id
from app.db.session import get_db
from app.models.user import User
from app.schemas.ai import (
    OnboardingMessage, OnboardingResponse,
    ModuleRequestMessage, ModuleRequestResponse,
)
from app.services.ai.onboarding import process_onboarding_message
from app.services.ai.module_expander import process_module_request

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/onboarding", response_model=OnboardingResponse)
async def onboarding_chat(
    data: OnboardingMessage,
    user: User = Depends(get_current_user),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """AI onboarding chat – detects industry, activates modules."""
    result = await process_onboarding_message(db, tenant_id, user.id, data.message)
    return OnboardingResponse(**result)


@router.post("/expand-module", response_model=ModuleRequestResponse)
async def expand_module(
    data: ModuleRequestMessage,
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """User requests a new tool via prompt – AI creates and activates it."""
    result = await process_module_request(db, tenant_id, data.prompt)
    return ModuleRequestResponse(**result)

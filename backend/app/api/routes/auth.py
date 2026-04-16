from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password, create_access_token
from app.db.session import get_db
from app.models.user import User, Tenant, TenantMember, UserRole
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
    )
    db.add(user)
    await db.flush()

    tenant = Tenant(name=data.tenant_name)
    db.add(tenant)
    await db.flush()

    membership = TenantMember(tenant_id=tenant.id, user_id=user.id, role=UserRole.OWNER)
    db.add(membership)
    await db.commit()

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, tenant_id=tenant.id, user_id=user.id)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    member_result = await db.execute(
        select(TenantMember.tenant_id).where(TenantMember.user_id == user.id).limit(1)
    )
    tenant_id = member_result.scalar()
    
    if not tenant_id:
        # Fallback if no tenant exists for some reason
        tenant_id = str(user.id) # Or raise a clean 400 error instead of 500

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, tenant_id=tenant_id, user_id=user.id)

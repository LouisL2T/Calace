"""Shared API dependencies – auth, tenant resolution."""
import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User, TenantMember

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return user


async def get_tenant_id(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> uuid.UUID:
    result = await db.execute(
        select(TenantMember.tenant_id).where(TenantMember.user_id == user.id).limit(1)
    )
    tenant_id = result.scalar_one_or_none()
    if not tenant_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tenant assigned")
    return tenant_id

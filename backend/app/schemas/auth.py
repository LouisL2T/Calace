from uuid import UUID
from pydantic import BaseModel


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    tenant_name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    tenant_id: UUID
    user_id: UUID

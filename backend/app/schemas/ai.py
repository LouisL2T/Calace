from uuid import UUID
from pydantic import BaseModel


class OnboardingMessage(BaseModel):
    message: str


class OnboardingResponse(BaseModel):
    reply: str
    modules_activated: list[str]
    industry_detected: str | None = None
    onboarding_complete: bool = False
    dynamic_fields_added: list[dict] | None = None


class ModuleRequestMessage(BaseModel):
    prompt: str


class ModuleRequestResponse(BaseModel):
    reply: str
    module_slug: str | None = None
    module_name: str | None = None
    module_activated: bool = False
    component_path: str | None = None

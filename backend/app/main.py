from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, calendar, crm, ai, communication, business, modules, orders
from app.core.config import settings
from app.db.session import engine
from app.db.base import Base
from app.models import user as user_models, crm as crm_models, calendar as calendar_models, ai as ai_models, communication as communication_models, business as business_models, modules as modules_models

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.DATABASE_URL.startswith("sqlite"):
        async with engine.begin() as conn:
            # Note: This might fail if using Postgres-specific types, 
            # we'll handle that by making models more generic.
            await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title=settings.APP_NAME,
    description="KI-Adaptive Business & Calendar Platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all route groups under /api/v1
app.include_router(auth.router, prefix="/api/v1")
app.include_router(calendar.router, prefix="/api/v1")
app.include_router(crm.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(communication.router, prefix="/api/v1")
app.include_router(business.router, prefix="/api/v1")
app.include_router(modules.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}

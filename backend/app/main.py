import logging
import traceback

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.routes import auth, calendar, crm, ai, communication, business, modules, orders, notifications, checklist, color_rules, fleet
from app.core.config import settings
from app.db.session import engine
from app.db.base import Base
from app.models import user as user_models, crm as crm_models, calendar as calendar_models, ai as ai_models, communication as communication_models, business as business_models, modules as modules_models
from app.models import notification as notification_models, checklist as checklist_models, color_rule as color_rule_models

from contextlib import asynccontextmanager

logger = logging.getLogger("calace")

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://celebrated-baklava-0b1abe.netlify.app",
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    # For SQLite (local dev only): create tables on startup
    if settings.DATABASE_URL.startswith("sqlite"):
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    # For Postgres (production): migrations are managed via Alembic CLI
    yield

app = FastAPI(
    title=settings.APP_NAME,
    description="KI-Adaptive Business & Calendar Platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global exception handler: ensures CORS headers are ALWAYS present ────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch all unhandled exceptions and return a JSON response with CORS headers."""
    origin = request.headers.get("origin", "")
    logger.error("Unhandled exception on %s %s: %s", request.method, request.url.path, exc)
    logger.error(traceback.format_exc())

    response = JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {type(exc).__name__}: {str(exc)}"},
    )

    # Manually add CORS headers so the browser can read the error
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"

    return response


# Mount all route groups under /api/v1
app.include_router(auth.router, prefix="/api/v1")
app.include_router(calendar.router, prefix="/api/v1")
app.include_router(crm.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(communication.router, prefix="/api/v1")
app.include_router(business.router, prefix="/api/v1")
app.include_router(modules.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(checklist.router, prefix="/api/v1")
app.include_router(color_rules.router, prefix="/api/v1")
app.include_router(fleet.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}


@app.get("/health/db")
async def health_db():
    """Diagnostic endpoint: checks if the database is reachable."""
    db_url = settings.DATABASE_URL
    # Mask password for safety
    masked = db_url
    if "@" in db_url:
        pre_at = db_url.split("@")[0]
        post_at = db_url.split("@")[1]
        if ":" in pre_at:
            parts = pre_at.rsplit(":", 1)
            masked = f"{parts[0]}:****@{post_at}"

    try:
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            result.fetchone()
        return {"status": "ok", "database": masked}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "database": masked, "error": f"{type(e).__name__}: {str(e)}"},
        )

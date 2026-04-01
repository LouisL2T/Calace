from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, calendar, crm, ai, communication, business, modules
from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    description="KI-Adaptive Business & Calendar Platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
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


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}

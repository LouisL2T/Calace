from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

engine_kwargs: dict = {}

if settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
elif "pooler.supabase.com" in settings.DATABASE_URL or ":6543" in settings.DATABASE_URL:
    # Supabase Transaction Mode Pooler requires prepared statements to be disabled
    # because pgBouncer in transaction mode does not support them.
    engine_kwargs["connect_args"] = {"statement_cache_size": 0}

engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG, **engine_kwargs)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session

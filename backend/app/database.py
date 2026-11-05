"""
Dridha Crafts - Database Connection
Uses SQLAlchemy async engine connected to Supabase PostgreSQL.
"""

from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings


settings = get_settings()

# Convert postgres:// to postgresql+asyncpg:// for async driver
database_url = settings.DATABASE_URL
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

is_pgbouncer = "pgbouncer=true" in database_url.lower() or ":6543" in database_url

# Strip pgbouncer query param from URL since asyncpg does not accept it as a kwarg
if "?pgbouncer=true" in database_url:
    database_url = database_url.replace("?pgbouncer=true", "")
elif "&pgbouncer=true" in database_url:
    database_url = database_url.replace("&pgbouncer=true", "")

connect_args = {}
if is_pgbouncer:
    connect_args["statement_cache_size"] = 0
    connect_args["prepared_statement_cache_size"] = 0
    connect_args["prepared_statement_name_func"] = lambda: f"__asyncpg_{uuid4()}__"

engine = create_async_engine(
    database_url,
    echo=settings.DEBUG,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args=connect_args,
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


async def get_db() -> AsyncSession:
    """
    Dependency that provides a database session per request.
    Automatically commits on success, rolls back on error.
    """
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

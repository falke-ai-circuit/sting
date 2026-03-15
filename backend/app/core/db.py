import asyncpg
from typing import Optional
from contextlib import asynccontextmanager
from app.core.config import settings

_pool: Optional[asyncpg.Pool] = None

async def init_db():
    global _pool
    _pool = await asyncpg.create_pool(
        host=settings.db_host,
        port=settings.db_port,
        database=settings.db_name,
        user=settings.db_user,
        password=settings.db_password,
        min_size=2,
        max_size=10,
    )
    await _create_schema()

async def close_db():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None

def get_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("Database pool not initialized")
    return _pool

@asynccontextmanager
async def get_conn():
    pool = get_pool()
    async with pool.acquire() as conn:
        yield conn

async def _create_schema():
    async with get_conn() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                source_ip TEXT NOT NULL,
                source_port INTEGER,
                protocol TEXT NOT NULL DEFAULT 'ssh',
                score INTEGER NOT NULL DEFAULT 100,
                state TEXT NOT NULL DEFAULT 'hostile',
                verdict TEXT,
                username TEXT,
                started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                ended_at TIMESTAMPTZ,
                committed_at TIMESTAMPTZ,
                nuked_at TIMESTAMPTZ,
                metadata JSONB DEFAULT '{}'
            );

            CREATE TABLE IF NOT EXISTS events (
                id BIGSERIAL PRIMARY KEY,
                session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
                event_type TEXT NOT NULL,
                data JSONB NOT NULL DEFAULT '{}',
                score_delta INTEGER NOT NULL DEFAULT 0,
                ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS canaries (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                canary_type TEXT NOT NULL,
                value TEXT NOT NULL,
                triggered_by UUID REFERENCES sessions(id),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                triggered_at TIMESTAMPTZ
            );

            CREATE TABLE IF NOT EXISTS samples (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                session_id UUID REFERENCES sessions(id),
                filename TEXT,
                sha256 TEXT,
                size_bytes BIGINT,
                content BYTEA,
                uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                malware_family TEXT,
                vt_detections INTEGER,
                analysis_status TEXT DEFAULT 'pending'
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                session_id UUID REFERENCES sessions(id),
                filename TEXT,
                sha256 TEXT,
                size_bytes BIGINT,
                content BYTEA,
                uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS lab_snapshots (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
                source_ip TEXT,
                snapshot JSONB NOT NULL DEFAULT '{}',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS webhook_events (
                id BIGSERIAL PRIMARY KEY,
                source TEXT NOT NULL DEFAULT 'cowrie',
                event_type TEXT NOT NULL,
                src_ip TEXT,
                session_ref TEXT,
                raw JSONB NOT NULL DEFAULT '{}',
                received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS banned_ips (
                ip TEXT PRIMARY KEY,
                session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
                banned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                reason TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
            CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts DESC);
            CREATE INDEX IF NOT EXISTS idx_sessions_state ON sessions(state);
            CREATE INDEX IF NOT EXISTS idx_lab_snapshots_session ON lab_snapshots(session_id);
            CREATE INDEX IF NOT EXISTS idx_lab_snapshots_created ON lab_snapshots(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_webhook_events_received ON webhook_events(received_at DESC);
        """)

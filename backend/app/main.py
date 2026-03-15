import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.db import init_db, close_db
from app.proxy.ssh_proxy import start_ssh_proxy
from app.proxy.http_proxy import start_http_proxy
from app.lab.executor import lab_worker_loop
from app.verdict.engine import verdict_engine
from app.api.v1 import sessions, events, live, canaries, samples, export, stats, webhook, lab, snapshots, verdict, vt

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing database pool...")
    await init_db()
    logger.info("Database pool ready")

    # Init Redis for score persistence
    logger.info("Initializing Redis score persistence...")
    await verdict_engine.init_redis()
    logger.info("Redis ready")

    # Start SSH proxy
    logger.info("Starting STING SSH proxy on port %d...", settings.ssh_proxy_port)
    ssh_task = asyncio.create_task(start_ssh_proxy())
    await asyncio.sleep(0.5)  # Let server bind
    logger.info("SSH proxy started")

    # Start HTTP proxy (verdict-aware)
    logger.info("Starting STING HTTP proxy on port 8090...")
    http_task = asyncio.create_task(start_http_proxy())
    await asyncio.sleep(0.5)
    logger.info("HTTP proxy started")

    # Start Lab executor worker
    logger.info("Starting Lab executor worker...")
    lab_task = asyncio.create_task(lab_worker_loop())
    logger.info("Lab executor started")

    yield

    # Shutdown
    logger.info("Shutting down SSH proxy...")
    ssh_task.cancel()
    try:
        await ssh_task
    except asyncio.CancelledError:
        pass

    logger.info("Shutting down HTTP proxy...")
    http_task.cancel()
    try:
        await http_task
    except asyncio.CancelledError:
        pass

    logger.info("Shutting down Lab executor...")
    lab_task.cancel()
    try:
        await lab_task
    except asyncio.CancelledError:
        pass

    logger.info("Closing database pool...")
    await close_db()
    logger.info("Shutdown complete")


app = FastAPI(
    title=settings.app_name,
    version="2.0.0",
    lifespan=lifespan,
)

# CORS wildcard for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(sessions.router, prefix=f"{settings.api_prefix}")
app.include_router(events.router, prefix=f"{settings.api_prefix}")
app.include_router(live.router, prefix=f"{settings.api_prefix}")
app.include_router(canaries.router, prefix=f"{settings.api_prefix}")
app.include_router(samples.router, prefix=f"{settings.api_prefix}")
app.include_router(export.router, prefix=f"{settings.api_prefix}")
app.include_router(stats.router, prefix=f"{settings.api_prefix}")
app.include_router(webhook.router, prefix=f"{settings.api_prefix}")
app.include_router(lab.router, prefix=f"{settings.api_prefix}")
app.include_router(snapshots.router, prefix=f"{settings.api_prefix}")
app.include_router(verdict.router, prefix=f"{settings.api_prefix}")
app.include_router(vt.router, prefix=f"{settings.api_prefix}")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "sting-backend"}

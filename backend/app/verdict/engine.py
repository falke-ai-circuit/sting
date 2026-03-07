import asyncio
from typing import Dict, Optional, Callable, Awaitable
from uuid import UUID
from datetime import datetime
import logging
import redis.asyncio as redis
from app.core.config import settings

logger = logging.getLogger(__name__)

# Score weights for events
SCORE_RULES = {
    "connection_attempt": 0,       # neutral
    "auth_failure": +15,           # hostile signal
    "auth_success": -10,           # slight trust
    "command_executed": +5,        # suspicious
    "file_read_canary": +40,       # canary triggered
    "file_write": +10,
    "file_delete": +20,
    "download_tool": +30,          # wget/curl/tftp
    "privilege_escalation": +40,
    "lateral_movement": +35,
    "data_exfiltration": +45,
    "canary_dns": +50,
    "canary_token": +50,
    "clean_command": -5,           # benign command
    "idle_timeout": 0,
    "resource_limit_breach": +40,
}

REDIS_KEY_PREFIX = "sting:session"

class VerdictEngine:
    def __init__(self):
        self._scores: Dict[str, int] = {}
        self._lock = asyncio.Lock()
        self._listeners: list[Callable] = []
        self._redis: Optional[redis.Redis] = None

    async def init_redis(self):
        """Initialize Redis connection and load existing scores."""
        try:
            self._redis = redis.Redis(
                host=settings.redis_host,
                port=settings.redis_port,
                db=settings.redis_db,
                decode_responses=True
            )
            await self._load_all_scores()
            logger.info(f"VerdictEngine: Redis connected, loaded {len(self._scores)} scores")
        except Exception as e:
            logger.error(f"VerdictEngine: Redis connection failed: {e}")
            self._redis = None

    async def _load_all_scores(self):
        """Load all session scores from Redis on startup."""
        if not self._redis:
            return
        try:
            pattern = f"{REDIS_KEY_PREFIX}:*:score"
            keys = await self._redis.keys(pattern)
            for key in keys:
                # key format: sting:session:{session_id}:score
                parts = key.split(":")
                if len(parts) >= 4:
                    session_id = parts[2]
                    score_str = await self._redis.get(key)
                    if score_str:
                        self._scores[session_id] = int(score_str)
        except Exception as e:
            logger.error(f"Failed to load scores from Redis: {e}")

    def _redis_key(self, session_id: str) -> str:
        return f"{REDIS_KEY_PREFIX}:{session_id}:score"

    async def _persist_score(self, session_id: str, score: int):
        """Persist score to Redis."""
        if self._redis:
            try:
                await self._redis.set(self._redis_key(session_id), str(score))
            except Exception as e:
                logger.warning(f"Failed to persist score to Redis: {e}")

    async def _delete_score(self, session_id: str):
        """Delete score from Redis."""
        if self._redis:
            try:
                await self._redis.delete(self._redis_key(session_id))
            except Exception as e:
                logger.warning(f"Failed to delete score from Redis: {e}")

    def register_listener(self, fn: Callable):
        self._listeners.append(fn)

    async def _notify(self, session_id: str, event_type: str, delta: int, new_score: int):
        for fn in self._listeners:
            try:
                if asyncio.iscoroutinefunction(fn):
                    await fn(session_id, event_type, delta, new_score)
                else:
                    fn(session_id, event_type, delta, new_score)
            except Exception as e:
                logger.warning(f"Listener error: {e}")

    async def init_session(self, session_id: str) -> int:
        async with self._lock:
            self._scores[session_id] = 100  # starts hostile
            await self._persist_score(session_id, 100)
        return 100

    async def score_event(self, session_id: str, event_type: str, custom_delta: Optional[int] = None) -> int:
        delta = custom_delta if custom_delta is not None else SCORE_RULES.get(event_type, 0)
        async with self._lock:
            current = self._scores.get(session_id, 100)
            new_score = max(0, min(100, current + delta))
            self._scores[session_id] = new_score
            await self._persist_score(session_id, new_score)
        await self._notify(session_id, event_type, delta, new_score)
        logger.debug(f"Session {session_id}: {event_type} delta={delta:+d} score={new_score}")
        return new_score

    def get_score(self, session_id: str) -> int:
        return self._scores.get(session_id, 100)

    def is_hostile(self, session_id: str) -> bool:
        return self.get_score(session_id) >= 30

    def get_state(self, session_id: str) -> str:
        score = self.get_score(session_id)
        if score >= 70:
            return "hostile"
        elif score >= 30:
            return "suspicious"
        else:
            return "clean"

    async def remove_session(self, session_id: str):
        async with self._lock:
            self._scores.pop(session_id, None)
            await self._delete_score(session_id)

# Global instance
verdict_engine = VerdictEngine()

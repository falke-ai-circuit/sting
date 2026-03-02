import asyncio
from typing import Dict, Optional, Callable, Awaitable
from uuid import UUID
from datetime import datetime
import logging

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

class VerdictEngine:
    def __init__(self):
        self._scores: Dict[str, int] = {}
        self._lock = asyncio.Lock()
        self._listeners: list[Callable] = []

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
        return 100

    async def score_event(self, session_id: str, event_type: str, custom_delta: Optional[int] = None) -> int:
        delta = custom_delta if custom_delta is not None else SCORE_RULES.get(event_type, 0)
        async with self._lock:
            current = self._scores.get(session_id, 100)
            new_score = max(0, min(100, current + delta))
            self._scores[session_id] = new_score
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

# Global instance
verdict_engine = VerdictEngine()

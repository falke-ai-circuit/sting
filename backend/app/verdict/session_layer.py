import asyncio
from typing import Dict, Optional, Any
from uuid import UUID
from datetime import datetime
from enum import Enum
import logging
import json

from app.execution.nuke_executor import nuke_executor
from app.core.db import get_conn

logger = logging.getLogger(__name__)

class VerdictAction(str, Enum):
    NUKE = "NUKE"
    COMMIT = "COMMIT"
    LAB = "LAB"

class SessionBuffer:
    """Per-session write buffer. Real service untouched until COMMIT."""

    def __init__(self, session_id: str, source_ip: str):
        self.session_id = session_id
        self.source_ip = source_ip
        self.created_at = datetime.utcnow()
        self._writes: Dict[str, bytes] = {}     # path -> content
        self._commands: list[dict] = []          # command log
        self._reads: list[str] = []              # read access log
        self._lock = asyncio.Lock()
        self._verdict: Optional[VerdictAction] = None

    async def write(self, path: str, content: bytes):
        async with self._lock:
            self._writes[path] = content
        logger.info(f"[{self.session_id}] WRITE buffered: {path} ({len(content)} bytes)")

    async def read(self, path: str) -> Optional[bytes]:
        async with self._lock:
            self._reads.append(path)
            return self._writes.get(path)

    async def log_command(self, cmd: str, output: Optional[str] = None):
        async with self._lock:
            self._commands.append({
                "cmd": cmd,
                "output": output,
                "ts": datetime.utcnow().isoformat(),
            })

    async def diff(self) -> dict:
        async with self._lock:
            return {
                "session_id": self.session_id,
                "writes": {k: len(v) for k, v in self._writes.items()},
                "commands": self._commands.copy(),
                "reads": self._reads.copy(),
                "verdict": self._verdict,
            }

    async def nuke(self):
        """Drop everything. Zero trace."""
        async with self._lock:
            self._writes.clear()
            self._commands.clear()
            self._reads.clear()
            self._verdict = VerdictAction.NUKE
        logger.info(f"[{self.session_id}] NUKED — session layer wiped")

    async def commit(self) -> Dict[str, bytes]:
        """Return writes for merging to real service."""
        async with self._lock:
            self._verdict = VerdictAction.COMMIT
            return dict(self._writes)

    async def lab(self) -> dict:
        """Snapshot everything for lab analysis, then wipe proxy side."""
        async with self._lock:
            snapshot = {
                "session_id": self.session_id,
                "source_ip": self.source_ip,
                "created_at": self.created_at.isoformat(),
                "writes": {k: v.hex() for k, v in self._writes.items()},
                "commands": list(self._commands),
                "reads": list(self._reads),
            }
            self._verdict = VerdictAction.LAB
            self._writes.clear()
        logger.info(f"[{self.session_id}] LAB snapshot shipped — proxy side wiped")
        return snapshot

    async def store_lab_snapshot(self, snapshot: dict):
        """Persist LAB snapshot to PostgreSQL."""
        try:
            async with get_conn() as db:
                await db.execute("""
                    INSERT INTO lab_snapshots (
                        session_id, source_ip, writes, commands, reads, created_at
                    ) VALUES ($1, $2, $3, $4, $5, NOW())
                """, 
                    snapshot["session_id"],
                    snapshot["source_ip"],
                    json.dumps(snapshot.get("writes", {})),
                    json.dumps(snapshot.get("commands", [])),
                    json.dumps(snapshot.get("reads", []))
                )
                logger.info(f"LAB snapshot stored for session {self.session_id}")
        except Exception as e:
            logger.error(f"Failed to store LAB snapshot: {e}")


class SessionLayerManager:
    """Global manager for all active session buffers."""

    def __init__(self):
        self._sessions: Dict[str, SessionBuffer] = {}
        self._lock = asyncio.Lock()

    async def create(self, session_id: str, source_ip: str) -> SessionBuffer:
        buf = SessionBuffer(session_id, source_ip)
        async with self._lock:
            self._sessions[session_id] = buf
        return buf

    def get(self, session_id: str) -> Optional[SessionBuffer]:
        return self._sessions.get(session_id)

    async def apply_verdict(self, session_id: str, action: VerdictAction) -> dict:
        buf = self.get(session_id)
        if not buf:
            raise KeyError(f"Session {session_id} not found in layer manager")

        if action == VerdictAction.NUKE:
            # Execute NUKE: wipe buffer AND ban the IP
            await buf.nuke()
            nuke_result = await nuke_executor.execute_nuke(session_id, buf.source_ip)
            result = {
                "action": "NUKE",
                "session_id": session_id,
                "execution": nuke_result
            }
        elif action == VerdictAction.COMMIT:
            writes = await buf.commit()
            result = {"action": "COMMIT", "session_id": session_id, "files_written": len(writes)}
        elif action == VerdictAction.LAB:
            # Get snapshot and store to database
            snapshot = await buf.lab()
            await buf.store_lab_snapshot(snapshot)
            result = {"action": "LAB", "session_id": session_id, "snapshot": snapshot}
        else:
            raise ValueError(f"Unknown action: {action}")

        async with self._lock:
            self._sessions.pop(session_id, None)

        return result

    async def list_active(self) -> list[dict]:
        async with self._lock:
            result = []
            for sid, buf in self._sessions.items():
                diff = await buf.diff()
                result.append(diff)
            return result

# Global instance
session_layer = SessionLayerManager()

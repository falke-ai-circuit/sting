"""
LAB snapshot consumer.

GET  /api/v1/lab/snapshots        — list all stored LAB snapshots
GET  /api/v1/lab/snapshots/{id}   — get one snapshot by ID

Snapshots are stored when a session receives LAB verdict
(see sessions.py → apply_verdict → VerdictAction.LAB).
"""
import json
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.core.db import get_conn

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/lab", tags=["lab"])


@router.get("/snapshots")
async def list_snapshots(
    limit: int = Query(50, le=200),
    offset: int = 0,
    source_ip: Optional[str] = None,
):
    """List all LAB snapshots, newest first."""
    async with get_conn() as db:
        if source_ip:
            rows = await db.fetch("""
                SELECT id, session_id, source_ip, snapshot, created_at
                FROM lab_snapshots
                WHERE source_ip = $1
                ORDER BY created_at DESC
                LIMIT $2 OFFSET $3
            """, source_ip, limit, offset)
        else:
            rows = await db.fetch("""
                SELECT id, session_id, source_ip, snapshot, created_at
                FROM lab_snapshots
                ORDER BY created_at DESC
                LIMIT $1 OFFSET $2
            """, limit, offset)

    snapshots = []
    for r in rows:
        s = dict(r)
        s["id"] = str(s["id"])
        if s.get("session_id"):
            s["session_id"] = str(s["session_id"])
        if s.get("created_at"):
            s["created_at"] = s["created_at"].isoformat()
        snapshots.append(s)

    return {"snapshots": snapshots, "total": len(snapshots), "offset": offset}


@router.get("/snapshots/{snapshot_id}")
async def get_snapshot(snapshot_id: str):
    """Get a single LAB snapshot by ID (full snapshot data included)."""
    async with get_conn() as db:
        row = await db.fetchrow("""
            SELECT id, session_id, source_ip, snapshot, created_at
            FROM lab_snapshots
            WHERE id = $1::uuid
        """, snapshot_id)

    if not row:
        raise HTTPException(404, f"Snapshot {snapshot_id} not found")

    s = dict(row)
    s["id"] = str(s["id"])
    if s.get("session_id"):
        s["session_id"] = str(s["session_id"])
    if s.get("created_at"):
        s["created_at"] = s["created_at"].isoformat()
    # snapshot is already a dict (asyncpg deserializes JSONB)
    if isinstance(s.get("snapshot"), str):
        s["snapshot"] = json.loads(s["snapshot"])

    return s


@router.delete("/snapshots/{snapshot_id}")
async def delete_snapshot(snapshot_id: str):
    """Delete a LAB snapshot."""
    async with get_conn() as db:
        result = await db.execute("""
            DELETE FROM lab_snapshots WHERE id = $1::uuid
        """, snapshot_id)

    if result == "DELETE 0":
        raise HTTPException(404, f"Snapshot {snapshot_id} not found")

    return {"status": "deleted", "id": snapshot_id}

"""
LAB snapshot consumer.

GET  /api/v1/lab/snapshots        — list all stored LAB snapshots
GET  /api/v1/lab/snapshots/{id}   — get one snapshot by ID
POST /api/v1/lab/run              — submit a new lab job

Snapshots are stored when a session receives LAB verdict
(see sessions.py → apply_verdict → VerdictAction.LAB).
"""
import json
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.core.db import get_conn

logger = logging.getLogger(__name__)

router = APIRouter(tags=["lab"])


class RunLabRequest(BaseModel):
    sample_id: int
    timeout_s: int = 30


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


@router.post("/lab/run")
async def run_lab_job(req: RunLabRequest):
    """
    Submit a new lab job.

    Creates the lab_jobs table if it doesn't exist, inserts a new row
    with status 'queued', and returns the job details.
    """
    async with get_conn() as db:
        # Create lab_jobs table if not exists
        await db.execute("""
            CREATE TABLE IF NOT EXISTS lab_jobs (
                id SERIAL PRIMARY KEY,
                sample_id INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'queued',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        """)

        # Insert new job row
        row = await db.fetchrow("""
            INSERT INTO lab_jobs (sample_id, status)
            VALUES ($1, 'queued')
            RETURNING id, sample_id, status, created_at
        """, req.sample_id)

    return {
        "job_id": row["id"],
        "status": row["status"],
        "sample_id": row["sample_id"]
    }

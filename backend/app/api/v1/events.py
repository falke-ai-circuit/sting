from fastapi import APIRouter, Query
from typing import Optional
from app.core.db import get_conn

router = APIRouter(prefix="/events", tags=["events"])


@router.get("")
async def list_events(
    session_id: Optional[str] = Query(None, description="Filter by session ID"),
    limit: int = Query(100, le=500, description="Maximum events to return"),
):
    """List events with optional session_id filter."""
    async with get_conn() as db:
        if session_id:
            rows = await db.fetch("""
                SELECT * FROM events
                WHERE session_id = $1::uuid
                ORDER BY ts DESC
                LIMIT $2
            """, session_id, limit)
        else:
            rows = await db.fetch("""
                SELECT * FROM events
                ORDER BY ts DESC
                LIMIT $1
            """, limit)

    events = []
    for r in rows:
        e = dict(r)
        e["session_id"] = str(e["session_id"])
        if e.get("ts"):
            e["ts"] = e["ts"].isoformat()
        events.append(e)

    return {"events": events, "count": len(events)}

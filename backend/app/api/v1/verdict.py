"""
Verdict router for session verdict retrieval.

GET /api/v1/verdict/{session_id} — Get computed verdict for a session
"""
from fastapi import APIRouter
from app.core.db import get_conn

router = APIRouter(prefix="/verdict", tags=["verdict"])


@router.get("/{session_id}")
async def get_verdict(session_id: str):
    """
    Get computed verdict for a session.

    Verdict logic:
    - score >= 50 -> HOSTILE
    - score <= -20 -> CLEARED
    - else -> MONITORING

    Returns:
        - session_id: str
        - score: int (sum of all event score_deltas)
        - verdict: str (HOSTILE | CLEARED | MONITORING)
        - events_count: int
        - last_updated: ISO timestamp of last event
    """
    async with get_conn() as db:
        try:
            # Check if session exists
            session = await db.fetchrow("""
                SELECT id FROM sessions WHERE id = $1::uuid
            """, session_id)

            if not session:
                return {"detail": f"Session {session_id} not found"}

            # Get aggregated score and event count from events table
            row = await db.fetchrow("""
                SELECT
                    COALESCE(SUM(score_delta), 0) as total_score,
                    COUNT(*) as events_count,
                    MAX(ts) as last_updated
                FROM events
                WHERE session_id = $1::uuid
            """, session_id)
        except Exception:
            return {"detail": f"Session {session_id} not found"}

    score = row["total_score"]
    events_count = row["events_count"]
    last_updated = row["last_updated"]

    # Apply verdict logic
    if score >= 50:
        verdict = "HOSTILE"
    elif score <= -20:
        verdict = "CLEARED"
    else:
        verdict = "MONITORING"

    return {
        "session_id": session_id,
        "score": score,
        "verdict": verdict,
        "events_count": events_count,
        "last_updated": last_updated.isoformat() if last_updated else None
    }

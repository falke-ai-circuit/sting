from fastapi import APIRouter
from app.core.db import get_conn

router = APIRouter(prefix="/stats", tags=["stats"])


def calculate_threat_level(hostile_count: int) -> str:
    """Calculate threat level based on hostile session count."""
    if hostile_count == 0:
        return "low"
    elif hostile_count <= 10:
        return "medium"
    elif hostile_count <= 50:
        return "high"
    else:
        return "critical"


@router.get("")
async def get_stats():
    """Get system-wide statistics including threat level."""
    async with get_conn() as db:
        # Count sessions
        sessions_total = await db.fetchval("SELECT COUNT(*) FROM sessions")
        
        # Count events
        events_total = await db.fetchval("SELECT COUNT(*) FROM events")
        
        # Count samples
        samples_total = await db.fetchval("SELECT COUNT(*) FROM samples")
        
        # Count canaries
        canaries_total = await db.fetchval("SELECT COUNT(*) FROM canaries")
        
        # Count hostile sessions for threat level
        hostile_count = await db.fetchval(
            "SELECT COUNT(*) FROM sessions WHERE state = 'hostile'"
        )
        
        # Calculate threat level
        threat_level = calculate_threat_level(hostile_count)
    
    return {
        "sessions_total": sessions_total or 0,
        "events_total": events_total or 0,
        "samples_total": samples_total or 0,
        "canaries_total": canaries_total or 0,
        "threat_level": threat_level,
    }

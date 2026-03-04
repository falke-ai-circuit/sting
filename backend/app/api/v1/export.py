from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel
from app.core.db import get_conn
import json
from datetime import datetime, timedelta
from fastapi.responses import StreamingResponse
import io

router = APIRouter(prefix="/export", tags=["export"])


# Detection rule model
class DetectionRule(BaseModel):
    id: Optional[str] = None
    name: str
    pattern: str
    severity: str  # low, medium, high, critical
    description: Optional[str] = None
    enabled: bool = True


@router.get("/rules", response_model=List[dict])
async def list_rules(
    enabled: Optional[bool] = Query(None, description="Filter by enabled status"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
):
    """List detection rules."""
    # In-memory rules for now (could be DB-backed)
    rules = [
        {"id": "BRUTE_FORCE_001", "name": "Rapid Login Attempts", "pattern": ".*", "severity": "medium", "enabled": True},
        {"id": "MALWARE_001", "name": "Malware Download", "pattern": "curl|wget.*\\.(sh|pl|py|exe)", "severity": "high", "enabled": True},
        {"id": "PERSISTENCE_001", "name": "Backdoor Attempt", "pattern": "cron|ssh.*authorized_keys", "severity": "critical", "enabled": True},
    ]
    
    filtered = rules
    if enabled is not None:
        filtered = [r for r in filtered if r["enabled"] == enabled]
    if severity:
        filtered = [r for r in filtered if r["severity"] == severity]
    
    return filtered


@router.get("/rules/{rule_id}")
async def get_rule(rule_id: str):
    """Get a specific rule."""
    rules = await list_rules()
    for r in rules:
        if r["id"] == rule_id:
            return r
    raise HTTPException(404, "Rule not found")


@router.post("/rules")
async def create_rule(rule: DetectionRule):
    """Create a new detection rule."""
    # In-memory for now
    new_rule = {
        "id": rule.name.upper().replace(" ", "_"),
        "name": rule.name,
        "pattern": rule.pattern,
        "severity": rule.severity,
        "description": rule.description,
        "enabled": rule.enabled,
    }
    return new_rule


@router.delete("/rules/{rule_id}")
async def delete_rule(rule_id: str):
    """Delete a rule (placeholder)."""
    return {"deleted": rule_id}


@router.get("/sessions")
async def export_sessions(
    format: str = Query("json", description="Export format: json, csv"),
    state: Optional[str] = Query(None, description="Filter by state"),
    limit: int = Query(1000, le=10000),
):
    """Export sessions data."""
    async with get_conn() as db:
        if state:
            rows = await db.fetch("""
                SELECT * FROM sessions WHERE state = $1
                ORDER BY started_at DESC LIMIT $2
            """, state, limit)
        else:
            rows = await db.fetch("""
                SELECT * FROM sessions ORDER BY started_at DESC LIMIT $1
            """, limit)

    sessions = []
    for r in rows:
        s = dict(r)
        s["id"] = str(s["id"])
        for k in ("started_at", "ended_at", "committed_at", "nuked_at"):
            if s.get(k):
                s[k] = s[k].isoformat()
        sessions.append(s)

    if format == "csv":
        import csv
        output = io.StringIO()
        if sessions:
            writer = csv.DictWriter(output, fieldnames=sessions[0].keys())
            writer.writeheader()
            writer.writerows(sessions)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=sessions.csv"}
        )
    
    return {"sessions": sessions, "count": len(sessions)}


@router.get("/events")
async def export_events(
    format: str = Query("json", description="Export format: json, csv, jsonl"),
    session_id: Optional[str] = Query(None, description="Filter by session"),
    limit: int = Query(1000, le=10000),
):
    """Export events data."""
    async with get_conn() as db:
        if session_id:
            rows = await db.fetch("""
                SELECT * FROM events WHERE session_id = $1::uuid
                ORDER BY ts DESC LIMIT $2
            """, session_id, limit)
        else:
            rows = await db.fetch("""
                SELECT * FROM events ORDER BY ts DESC LIMIT $1
            """, limit)

    events = []
    for r in rows:
        e = dict(r)
        e["session_id"] = str(e["session_id"])
        if e.get("ts"):
            e["ts"] = e["ts"].isoformat()
        events.append(e)

    if format == "csv":
        import csv
        output = io.StringIO()
        if events:
            writer = csv.DictWriter(output, fieldnames=events[0].keys())
            writer.writeheader()
            writer.writerows(events)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=events.csv"}
        )
    
    if format == "jsonl":
        output = io.StringIO()
        for e in events:
            output.write(json.dumps(e) + "\n")
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="application/x-ndjson",
            headers={"Content-Disposition": "attachment; filename=events.jsonl"}
        )
    
    return {"events": events, "count": len(events)}


@router.get("/stats")
async def get_stats():
    """Get pipeline statistics."""
    async with get_conn() as db:
        # Session stats
        session_stats = await db.fetchrow("""
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE state = 'hostile') as hostile,
                COUNT(*) FILTER (WHERE state = 'committed') as committed,
                COUNT(*) FILTER (WHERE state = 'nuked') as nuked,
                COUNT(*) FILTER (WHERE state = 'lab') as lab
            FROM sessions
        """)
        
        # Event stats
        event_stats = await db.fetchrow("""
            SELECT COUNT(*) as total FROM events
        """)
        
        # Recent activity (last 24h)
        recent = await db.fetchrow("""
            SELECT COUNT(*) as count FROM sessions 
            WHERE started_at > NOW() - INTERVAL '24 hours'
        """)

    return {
        "sessions": dict(session_stats) if session_stats else {},
        "events": dict(event_stats) if event_stats else {},
        "last_24h": dict(recent) if recent else {}
    }

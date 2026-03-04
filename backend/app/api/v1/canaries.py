from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from app.core.db import get_conn

router = APIRouter(prefix="/canaries", tags=["canaries"])


class CanaryCreate(BaseModel):
    name: str
    canary_type: str  # "ssh", "http", "file", "dns"
    value: str  # The token/credential/path


class CanaryResponse(BaseModel):
    id: str
    name: str
    canary_type: str
    value: str
    triggered_by: Optional[str] = None
    created_at: str
    triggered_at: Optional[str] = None


@router.get("", response_model=List[CanaryResponse])
async def list_canaries(
    triggered: Optional[bool] = Query(None, description="Filter by triggered status"),
    canary_type: Optional[str] = Query(None, description="Filter by type"),
    limit: int = Query(50, le=200),
):
    """List all canary tokens, optionally filtered."""
    async with get_conn() as db:
        query = "SELECT * FROM canaries WHERE 1=1"
        params = []
        
        if triggered is not None:
            if triggered:
                query += " AND triggered_at IS NOT NULL"
            else:
                query += " AND triggered_at IS NULL"
        
        if canary_type:
            query += f" AND canary_type = ${len(params) + 1}"
            params.append(canary_type)
        
        query += f" ORDER BY created_at DESC LIMIT ${len(params) + 1}"
        params.append(limit)
        
        rows = await db.fetch(query, *params)

    canaries = []
    for r in rows:
        c = dict(r)
        c["id"] = str(c["id"])
        if c.get("triggered_by"):
            c["triggered_by"] = str(c["triggered_by"])
        if c.get("created_at"):
            c["created_at"] = c["created_at"].isoformat()
        if c.get("triggered_at"):
            c["triggered_at"] = c["triggered_at"].isoformat()
        canaries.append(c)
    
    return canaries


@router.post("", response_model=CanaryResponse)
async def create_canary(canary: CanaryCreate):
    """Create a new canary token."""
    async with get_conn() as db:
        row = await db.fetchrow("""
            INSERT INTO canaries (name, canary_type, value)
            VALUES ($1, $2, $3)
            RETURNING *
        """, canary.name, canary.canary_type, canary.value)
    
    c = dict(row)
    c["id"] = str(c["id"])
    if c.get("created_at"):
        c["created_at"] = c["created_at"].isoformat()
    return c


@router.get("/{canary_id}", response_model=CanaryResponse)
async def get_canary(canary_id: str):
    """Get a specific canary token by ID."""
    async with get_conn() as db:
        row = await db.fetchrow("SELECT * FROM canaries WHERE id = $1::uuid", canary_id)
    
    if not row:
        raise HTTPException(404, "Canary token not found")
    
    c = dict(row)
    c["id"] = str(c["id"])
    if c.get("triggered_by"):
        c["triggered_by"] = str(c["triggered_by"])
    if c.get("created_at"):
        c["created_at"] = c["created_at"].isoformat()
    if c.get("triggered_at"):
        c["triggered_at"] = c["triggered_at"].isoformat()
    return c


@router.delete("/{canary_id}")
async def delete_canary(canary_id: str):
    """Delete a canary token."""
    async with get_conn() as db:
        result = await db.execute("DELETE FROM canaries WHERE id = $1::uuid", canary_id)
    
    if result == "DELETE 0":
        raise HTTPException(404, "Canary token not found")
    
    return {"deleted": canary_id}


@router.post("/{canary_id}/trigger")
async def trigger_canary(canary_id: str, session_id: Optional[str] = None):
    """Mark a canary token as triggered."""
    async with get_conn() as db:
        row = await db.fetchrow("SELECT * FROM canaries WHERE id = $1::uuid", canary_id)
    
    if not row:
        raise HTTPException(404, "Canary token not found")
    
    async with get_conn() as db:
        await db.execute("""
            UPDATE canaries 
            SET triggered_at = NOW(), triggered_by = $2::uuid
            WHERE id = $1::uuid
        """, canary_id, session_id)
    
    return {"triggered": canary_id, "by_session": session_id}

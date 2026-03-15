from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from typing import Optional, List
from pydantic import BaseModel
from app.core.db import get_conn
import hashlib
import re

router = APIRouter(prefix="/samples", tags=["samples"])


class SampleResponse(BaseModel):
    id: str
    session_id: Optional[str] = None
    filename: Optional[str] = None
    sha256: Optional[str] = None
    size_bytes: Optional[int] = None
    uploaded_at: str
    malware_family: Optional[str] = None
    vt_detections: Optional[int] = None
    analysis_status: Optional[str] = None


# SHA256 regex pattern (64 hex characters)
SHA256_PATTERN = re.compile(r'^[a-fA-F0-9]{64}$')


@router.get("", response_model=List[SampleResponse])
async def list_samples(
    session_id: Optional[str] = Query(None, description="Filter by session ID"),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
):
    """List uploaded samples, optionally filtered by session."""
    async with get_conn() as db:
        if session_id:
            rows = await db.fetch("""
                SELECT * FROM samples 
                WHERE session_id = $1::uuid
                ORDER BY uploaded_at DESC 
                LIMIT $2 OFFSET $3
            """, session_id, limit, offset)
        else:
            rows = await db.fetch("""
                SELECT * FROM samples 
                ORDER BY uploaded_at DESC 
                LIMIT $1 OFFSET $2
            """, limit, offset)

    samples = []
    for r in rows:
        s = dict(r)
        s["id"] = str(s["id"])
        if s.get("session_id"):
            s["session_id"] = str(s["session_id"])
        if s.get("uploaded_at"):
            s["uploaded_at"] = s["uploaded_at"].isoformat()
        samples.append(s)
    
    return samples


@router.post("", response_model=SampleResponse)
async def upload_sample(
    session_id: Optional[str] = Query(None, description="Associated session ID"),
    file: UploadFile = File(...),
):
    """Upload a file sample for analysis."""
    content = await file.read()
    size_bytes = len(content)
    sha256_hash = hashlib.sha256(content).hexdigest()
    
    async with get_conn() as db:
        row = await db.fetchrow("""
            INSERT INTO samples (session_id, filename, sha256, size_bytes, content)
            VALUES ($1::uuid, $2, $3, $4, $5)
            RETURNING *
        """, session_id, file.filename, sha256_hash, size_bytes, content)
    
    s = dict(row)
    s["id"] = str(s["id"])
    if s.get("session_id"):
        s["session_id"] = str(s["session_id"])
    if s.get("uploaded_at"):
        s["uploaded_at"] = s["uploaded_at"].isoformat()
    # Don't return content
    del s["content"]
    return s


# Download by SHA256 - must come before /{sample_id} route
# Frontend calls: /api/v1/samples/{sha256}/download
@router.get("/{sha256_or_id}/download")
async def download_sample(sha256_or_id: str):
    """Download a sample by SHA256 hash or ID."""
    # Check if it looks like a SHA256 (64 hex chars)
    if SHA256_PATTERN.match(sha256_or_id):
        # Query by SHA256
        async with get_conn() as db:
            row = await db.fetchrow(
                "SELECT filename, content FROM samples WHERE sha256 = $1", 
                sha256_or_id
            )
    else:
        # Query by UUID
        async with get_conn() as db:
            row = await db.fetchrow(
                "SELECT filename, content FROM samples WHERE id = $1::uuid", 
                sha256_or_id
            )
    
    if not row:
        raise HTTPException(404, "Sample not found")
    
    from fastapi.responses import Response
    return Response(
        content=row["content"],
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename={row['filename']}"}
    )


@router.get("/{sample_id}", response_model=SampleResponse)
async def get_sample(sample_id: str):
    """Get a specific sample by ID."""
    async with get_conn() as db:
        row = await db.fetchrow("SELECT * FROM samples WHERE id = $1::uuid", sample_id)
    
    if not row:
        raise HTTPException(404, "Sample not found")
    
    s = dict(row)
    s["id"] = str(s["id"])
    if s.get("session_id"):
        s["session_id"] = str(s["session_id"])
    if s.get("uploaded_at"):
        s["uploaded_at"] = s["uploaded_at"].isoformat()
    return s


@router.delete("/{sample_id}")
async def delete_sample(sample_id: str):
    """Delete a sample."""
    async with get_conn() as db:
        result = await db.execute("DELETE FROM samples WHERE id = $1::uuid", sample_id)
    
    if result == "DELETE 0":
        raise HTTPException(404, "Sample not found")
    
    return {"deleted": sample_id}


@router.get("/{sample_id}/content")
async def get_sample_content(sample_id: str):
    """Get the raw content of a sample by ID."""
    async with get_conn() as db:
        row = await db.fetchrow("SELECT filename, content FROM samples WHERE id = $1::uuid", sample_id)
    
    if not row:
        raise HTTPException(404, "Sample not found")
    
    from fastapi.responses import Response
    return Response(
        content=row["content"],
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename={row['filename']}"}
    )

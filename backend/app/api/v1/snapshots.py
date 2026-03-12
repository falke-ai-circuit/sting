from fastapi import APIRouter
from .lab import list_snapshots

router = APIRouter(tags=["snapshots"])

@router.get("/snapshots")
async def snapshots_root():
    return await list_snapshots()

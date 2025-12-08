from fastapi import APIRouter, Query
from typing import Optional
from app.handlers.astronomy_handler import astronomy_events_handler

router = APIRouter()


@router.get("/astro/events")
async def events(
    days: Optional[int] = Query(7, ge=1, le=7, description="Number of days from today (NEO API ограничен 7 днями)"),
    limit: Optional[int] = Query(None, ge=1, le=1000, description="Maximum number of events to return"),
):
    """
    Get NEO (Near Earth Objects) events from NASA Asteroids - NeoWs API.
    
    Args:
        days: Number of days from today (1-7, default: 7)
        limit: Maximum number of events to return (optional)
    """
    return await astronomy_events_handler(
        days=days,
        limit=limit,
    )


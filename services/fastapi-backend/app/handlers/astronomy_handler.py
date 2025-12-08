from app.clients.astronomy_client import AstronomyClient
from app.services.astronomy_service import AstronomyService
from typing import Any, Optional


async def astronomy_events_handler(
    days: int = 7,
    limit: Optional[int] = None,
) -> dict[str, Any]:
    """
    Get NEO (Near Earth Objects) events from NASA Asteroids - NeoWs API.
    
    Args:
        days: Number of days from today (1-7)
        limit: Maximum number of events to return (optional)
    """
    try:
        client = AstronomyClient()
        service = AstronomyService(client)
        
        data = await service.get_events(
            days=days,
            limit=limit
        )
        
        return data
    except Exception as e:
        return {"error": f"Error fetching astronomy events: {str(e)}"}


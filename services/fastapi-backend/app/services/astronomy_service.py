from app.clients.astronomy_client import AstronomyClient
from typing import Any, Optional, Dict


class AstronomyService:
    """Сервис для работы с Astronomy API"""
    
    def __init__(self, client: AstronomyClient):
        self.client = client
    
    async def get_events(
        self,
        days: int = 7,
        limit: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get NEO (Near Earth Objects) events from NASA Asteroids - NeoWs API.
        
        Args:
            days: Number of days from today (1-7)
            limit: Maximum number of events to return (optional)
            
        Returns:
            Astronomical events data
        """
        try:
            data = await self.client.get_events(
                days=days,
                limit=limit
            )
            
            # Если есть ошибка, возвращаем её
            if "error" in data:
                return data
            
            # NASA API уже возвращает структурированные события
            if isinstance(data, dict) and "events" in data:
                return data
            else:
                # Неизвестный формат
                return {
                    "filters": {
                        "days": days,
                        "limit": limit
                    },
                    "events": []
                }
        except Exception as e:
            return {"error": f"Error fetching astronomy events: {str(e)}"}


import httpx
from typing import Any
from app.config.settings import settings


class IssClient:
    """Клиент для API ISS (Where The ISS At)"""
    
    def __init__(self):
        self.base_url = settings.where_iss_url
        self.timeout = settings.api_timeout
    
    async def fetch_current_position(self) -> dict[str, Any]:
        """Получить текущую позицию МКС"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(self.base_url)
            response.raise_for_status()
            return response.json()


import httpx
from typing import Any
from datetime import datetime, timedelta
from app.config.settings import settings


class NasaClient:
    """Клиент для различных NASA API (APOD, NEO, DONKI, SpaceX)"""
    
    def __init__(self):
        self.api_key = settings.nasa_api_key
        self.timeout = settings.api_timeout
    
    async def fetch_apod(self) -> dict[str, Any]:
        """Получить Astronomy Picture of the Day"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            url = "https://api.nasa.gov/planetary/apod"
            params = {"thumbs": "true"}
            if self.api_key:
                params["api_key"] = self.api_key
            
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()
    
    async def fetch_neo_feed(self, days: int = 2) -> dict[str, Any]:
        """Получить данные о околоземных объектах (NEO)"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            today = datetime.utcnow().date()
            start_date = today - timedelta(days=days)
            
            url = "https://api.nasa.gov/neo/rest/v1/feed"
            params = {
                "start_date": start_date.isoformat(),
                "end_date": today.isoformat(),
            }
            if self.api_key:
                params["api_key"] = self.api_key
            
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()
    
    async def fetch_donki_flr(self, days: int = 5) -> dict[str, Any]:
        """Получить данные о солнечных вспышках (FLR)"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            today = datetime.utcnow().date()
            start_date = today - timedelta(days=days)
            
            url = "https://api.nasa.gov/DONKI/FLR"
            params = {
                "startDate": start_date.isoformat(),
                "endDate": today.isoformat(),
            }
            if self.api_key:
                params["api_key"] = self.api_key
            
            try:
                response = await client.get(url, params=params)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 403:
                    return {"error": "Forbidden: Check API key and rate limits", "status_code": 403}
                raise
            except Exception as e:
                return {"error": str(e)}
    
    async def fetch_donki_cme(self, days: int = 5) -> dict[str, Any]:
        """Получить данные о выбросах корональной массы (CME)"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            today = datetime.utcnow().date()
            start_date = today - timedelta(days=days)
            
            url = "https://api.nasa.gov/DONKI/CME"
            params = {
                "startDate": start_date.isoformat(),
                "endDate": today.isoformat(),
            }
            if self.api_key:
                params["api_key"] = self.api_key
            
            try:
                response = await client.get(url, params=params)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 403:
                    # 403 Forbidden - возможно нужен API ключ или превышен лимит
                    return {"error": "Forbidden: Check API key and rate limits", "status_code": 403}
                raise
            except Exception as e:
                return {"error": str(e)}
    
    async def fetch_spacex_next(self) -> dict[str, Any]:
        """Получить данные о следующем запуске SpaceX"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            url = "https://api.spacexdata.com/v4/launches/next"
            response = await client.get(url, timeout=self.timeout)
            response.raise_for_status()
            return response.json()


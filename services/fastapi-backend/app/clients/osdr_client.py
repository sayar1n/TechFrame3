import httpx
from typing import Any
from app.config.settings import settings


class OsdrClient:
    """Клиент для NASA OSDR API"""
    
    def __init__(self):
        self.base_url = settings.nasa_api_url
        self.api_key = settings.nasa_api_key
        self.timeout = settings.api_timeout
    
    async def fetch_datasets(self) -> list[dict[str, Any]]:
        """Получить список датасетов OSDR"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            params = {}
            if self.api_key:
                params["api_key"] = self.api_key
            
            response = await client.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Поддержка различных форматов ответа
            if isinstance(data, list):
                return data
            if isinstance(data, dict):
                if "items" in data:
                    return data["items"]
                if "results" in data:
                    return data["results"]
                # Если это объект вида {"OSD-1": {...}, "OSD-2": {...}}, преобразуем в массив
                if all(isinstance(k, str) and (k.startswith("OSD-") or "REST_URL" in str(v)) for k, v in data.items() if isinstance(v, dict)):
                    items = []
                    for key, value in data.items():
                        if isinstance(value, dict):
                            # Добавляем dataset_id из ключа
                            item = value.copy()
                            item["dataset_id"] = key
                            items.append(item)
                    return items
                return [data]
            return []


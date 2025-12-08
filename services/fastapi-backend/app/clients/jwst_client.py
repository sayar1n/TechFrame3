import httpx
from typing import Any
from app.config.settings import settings


class JwstClient:
    """Клиент для JWST API"""
    
    def __init__(self):
        self.base_url = (settings.jwst_host or "https://api.jwstapi.com").rstrip('/')
        self.api_key = settings.jwst_api_key or ""
        self.email = settings.jwst_email or ""
        self.timeout = settings.api_timeout
    
    async def fetch_data(self, endpoint: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        """Получить данные из JWST API"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            headers = {}
            if self.api_key:
                headers["x-api-key"] = self.api_key
            if self.email:
                headers["email"] = self.email
            
            url = f"{self.base_url}/{endpoint.lstrip('/')}"
            try:
                response = await client.get(url, headers=headers, params=params or {})
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                # Логируем ошибку для отладки
                if e.response.status_code == 401:
                    # 401 Unauthorized - нужен API ключ
                    return {"body": [], "data": [], "error": "JWST API key required"}
                # Возвращаем пустой ответ вместо исключения
                return {"body": [], "data": [], "error": f"HTTP {e.response.status_code}"}
            except Exception as ex:
                return {"body": [], "data": [], "error": str(ex)}


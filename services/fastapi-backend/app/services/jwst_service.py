from app.clients.jwst_client import JwstClient
from typing import Any


class JwstService:
    """Сервис для работы с данными JWST"""
    
    def __init__(self, client: JwstClient):
        self.client = client
    
    async def fetch_feed(self, params: dict[str, Any]) -> dict[str, Any]:
        """Получить ленту изображений JWST"""
        source = params.get("source", "jpg")
        suffix = params.get("suffix", "")
        program = params.get("program", "")
        page = params.get("page", 1)
        per_page = params.get("perPage", 24)
        
        # Выбираем эндпоинт в зависимости от source
        if source == "suffix" and suffix:
            path = f"all/suffix/{suffix.lstrip('/')}"
        elif source == "program" and program:
            path = f"program/id/{program}"
        else:
            path = "all/type/jpg"
        
        query_params = {
            "page": page,
            "perPage": per_page,
        }
        
        return await self.client.fetch_data(path, query_params)


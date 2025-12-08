from app.repo.osdr_repo import OsdrRepo
from app.clients.osdr_client import OsdrClient
from app.utils.validators import extract_string, extract_datetime
from typing import Any
from datetime import datetime, timezone


class OsdrService:
    """Сервис для работы с данными OSDR"""
    
    def __init__(self, repo: OsdrRepo, client: OsdrClient):
        self.repo = repo
        self.client = client
    
    async def sync_and_store(self) -> int:
        """Синхронизировать и сохранить данные OSDR"""
        items = await self.client.fetch_datasets()
        written = 0
        
        for item in items:
            dataset_id = extract_string(item, ["dataset_id", "id", "uuid", "studyId", "accession", "osdr_id"])
            title = extract_string(item, ["title", "name", "label"])
            status = extract_string(item, ["status", "state", "lifecycle"])
            rest_url = extract_string(item, ["REST_URL", "rest_url", "rest", "url", "link"])
            
            # Парсим дату обновления (TIMESTAMPTZ требует datetime с timezone)
            updated_str = extract_datetime(item, ["updated", "updated_at", "modified", "lastUpdated", "timestamp"])
            updated_at = None
            if updated_str:
                try:
                    # Парсим ISO формат и убеждаемся, что есть timezone
                    dt = datetime.fromisoformat(updated_str.replace("Z", "+00:00"))
                    # Если timezone не указан, используем UTC
                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=timezone.utc)
                    updated_at = dt
                except ValueError:
                    pass
            
            await self.repo.upsert_item(
                dataset_id=dataset_id,
                title=title,
                status=status,
                rest_url=rest_url,
                updated_at=updated_at,
                raw=item,
            )
            written += 1
        
        return written
    
    async def list_items(self, limit: int = 20) -> list[dict[str, Any]]:
        """Получить список элементов OSDR"""
        return await self.repo.list_items(limit=limit)
    
    async def count(self) -> int:
        """Получить количество элементов"""
        return await self.repo.count()


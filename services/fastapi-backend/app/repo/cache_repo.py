from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from typing import Any


class CacheRepo:
    """Репозиторий для работы с кэшем космических данных"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def insert_cache(self, source: str, payload: dict[str, Any]) -> int:
        """Вставить данные в кэш"""
        import json
        result = await self.session.execute(
            text("""
                INSERT INTO space_cache(source, payload)
                VALUES (:source, CAST(:payload AS jsonb))
                RETURNING id
            """),
            {"source": source, "payload": json.dumps(payload)}
        )
        await self.session.commit()
        row = result.fetchone()
        return row[0] if row else 0
    
    async def get_latest(self, source: str) -> Optional[dict[str, Any]]:
        """Получить последние данные из кэша по источнику"""
        result = await self.session.execute(
            text("""
                SELECT fetched_at, payload
                FROM space_cache
                WHERE source = :source
                ORDER BY id DESC
                LIMIT 1
            """),
            {"source": source}
        )
        row = result.fetchone()
        if row:
            return {
                "fetched_at": row[0],
                "payload": row[1],
            }
        return None


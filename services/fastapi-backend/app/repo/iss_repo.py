from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from datetime import datetime
from typing import Any


class IssRepo:
    """Репозиторий для работы с данными ISS"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def insert_fetch_log(self, source_url: str, payload: dict[str, Any]) -> int:
        """Вставить запись о получении данных ISS"""
        import json
        result = await self.session.execute(
            text("""
                INSERT INTO iss_fetch_log (source_url, payload)
                VALUES (:source_url, CAST(:payload AS jsonb))
                RETURNING id
            """),
            {"source_url": source_url, "payload": json.dumps(payload)}
        )
        await self.session.commit()
        row = result.fetchone()
        return row[0] if row else 0
    
    async def get_last(self) -> Optional[dict[str, Any]]:
        """Получить последнюю запись"""
        result = await self.session.execute(
            text("""
                SELECT id, fetched_at, source_url, payload
                FROM iss_fetch_log
                ORDER BY id DESC
                LIMIT 1
            """)
        )
        row = result.fetchone()
        if row:
            return {
                "id": row[0],
                "fetched_at": row[1],
                "source_url": row[2],
                "payload": row[3],
            }
        return None
    
    async def get_trend_data(self, limit: int = 2) -> list[dict[str, Any]]:
        """Получить данные для расчета тренда"""
        result = await self.session.execute(
            text("""
                SELECT fetched_at, payload
                FROM iss_fetch_log
                ORDER BY id DESC
                LIMIT :limit
            """),
            {"limit": limit}
        )
        rows = result.fetchall()
        # Возвращаем в обратном порядке (от старых к новым)
        return [
            {
                "fetched_at": row[0],
                "payload": row[1],
            }
            for row in reversed(rows)
        ]
    
    async def clear_all_data(self) -> int:
        """Удалить все данные из iss_fetch_log"""
        result = await self.session.execute(
            text("DELETE FROM iss_fetch_log")
        )
        await self.session.commit()
        return result.rowcount


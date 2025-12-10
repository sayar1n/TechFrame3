from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from datetime import datetime
from typing import Any


class OsdrRepo:
    """Репозиторий для работы с данными OSDR"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def upsert_item(
        self,
        dataset_id: Optional[str],
        title: Optional[str],
        status: Optional[str],
        rest_url: Optional[str],
        updated_at: Optional[datetime],
        raw: dict[str, Any],
    ) -> int:
        """
        Вставить или обновить элемент OSDR.
        
        Использует Upsert по бизнес-ключу dataset_id (вместо слепого INSERT).
        Это позволяет обновлять существующие записи при повторном получении данных,
        избегая дубликатов и сохраняя актуальность данных.
        
        Args:
            dataset_id: Бизнес-ключ для идентификации элемента
            title: Название элемента
            status: Статус элемента
            updated_at: Дата обновления (TIMESTAMPTZ)
            raw: Сырые данные в формате JSONB
        
        Returns:
            ID вставленной/обновленной записи
        """
        import json
        if dataset_id:
            # Upsert по бизнес-ключу dataset_id через ON CONFLICT
            result = await self.session.execute(
                text("""
                    INSERT INTO osdr_items(dataset_id, title, status, rest_url, updated_at, raw)
                    VALUES (:dataset_id, :title, :status, :rest_url, :updated_at, CAST(:raw AS jsonb))
                    ON CONFLICT (dataset_id) DO UPDATE
                    SET title = EXCLUDED.title,
                        status = EXCLUDED.status,
                        rest_url = EXCLUDED.rest_url,
                        updated_at = EXCLUDED.updated_at,
                        raw = EXCLUDED.raw
                    RETURNING id
                """),
                {
                    "dataset_id": dataset_id,
                    "title": title,
                    "status": status,
                    "rest_url": rest_url,
                    "updated_at": updated_at,
                    "raw": json.dumps(raw),
                }
            )
        else:
            # Простой INSERT если нет dataset_id
            result = await self.session.execute(
                text("""
                    INSERT INTO osdr_items(dataset_id, title, status, rest_url, updated_at, raw)
                    VALUES (NULL, :title, :status, :rest_url, :updated_at, CAST(:raw AS jsonb))
                    RETURNING id
                """),
                {
                    "title": title,
                    "status": status,
                    "rest_url": rest_url,
                    "updated_at": updated_at,
                    "raw": json.dumps(raw),
                }
            )
        
        await self.session.commit()
        row = result.fetchone()
        return row[0] if row else 0
    
    async def list_items(self, limit: int = 20, search: Optional[str] = None) -> list[dict[str, Any]]:
        if search:
            # Поиск по dataset_id, title или status (без учета регистра)
            # Также ищем в JSONB поле raw (включая ключи вида OSD-xxx)
            search_pattern = f"%{search.lower()}%"
            result = await self.session.execute(
                text("""
                    SELECT id, dataset_id, title, status, rest_url, updated_at, inserted_at, raw
                    FROM osdr_items
                    WHERE LOWER(COALESCE(dataset_id, '')) LIKE :search_pattern
                       OR LOWER(COALESCE(title, '')) LIKE :search_pattern
                       OR LOWER(COALESCE(status, '')) LIKE :search_pattern
                       OR LOWER(raw::text) LIKE :search_pattern
                    ORDER BY inserted_at DESC
                    LIMIT :limit
                """),
                {"limit": limit, "search_pattern": search_pattern}
            )
        else:
            result = await self.session.execute(
                text("""
                    SELECT id, dataset_id, title, status, rest_url, updated_at, inserted_at, raw
                    FROM osdr_items
                    ORDER BY inserted_at DESC
                    LIMIT :limit
                """),
                {"limit": limit}
            )
        rows = result.fetchall()
        return [
            {
                "id": row[0],
                "dataset_id": row[1],
                "title": row[2],
                "status": row[3],
                "rest_url": row[4],
                "updated_at": row[5],
                "inserted_at": row[6],
                "raw": row[7],
            }
            for row in rows
        ]
    
    async def count(self, search: Optional[str] = None) -> int:
        """Получить количество элементов OSDR с опциональным поиском"""
        if search:
            search_pattern = f"%{search.lower()}%"
            result = await self.session.execute(
                text("""
                    SELECT COUNT(*)
                    FROM osdr_items
                    WHERE LOWER(COALESCE(dataset_id, '')) LIKE :search_pattern
                       OR LOWER(COALESCE(title, '')) LIKE :search_pattern
                       OR LOWER(COALESCE(status, '')) LIKE :search_pattern
                       OR LOWER(raw::text) LIKE :search_pattern
                """),
                {"search_pattern": search_pattern}
            )
        else:
            result = await self.session.execute(
                text("SELECT COUNT(*) FROM osdr_items")
            )
        row = result.fetchone()
        return row[0] if row else 0


from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional, Any
from datetime import datetime


class TelemetryRepo:
    """Репозиторий для работы с данными telemetry_legacy"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_items(self, limit: int = 100) -> list[dict[str, Any]]:
        """Получить список элементов telemetry_legacy"""
        result = await self.session.execute(
            text("""
                SELECT id, recorded_at, voltage, temp, source_file
                FROM telemetry_legacy
                ORDER BY recorded_at DESC
                LIMIT :limit
            """),
            {"limit": limit}
        )
        rows = result.fetchall()
        return [
            {
                "id": row[0],
                "recorded_at": row[1],
                "voltage": float(row[2]) if row[2] else None,
                "temp": float(row[3]) if row[3] else None,
                "source_file": row[4],
            }
            for row in rows
        ]

    async def count(self) -> int:
        """Получить количество элементов telemetry_legacy"""
        result = await self.session.execute(
            text("SELECT COUNT(*) FROM telemetry_legacy")
        )
        row = result.fetchone()
        return row[0] if row else 0


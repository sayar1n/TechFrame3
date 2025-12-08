from app.repo.telemetry_repo import TelemetryRepo
from typing import Any


class TelemetryService:
    """Сервис для работы с данными telemetry_legacy"""

    def __init__(self, repo: TelemetryRepo):
        self.repo = repo

    async def list_items(self, limit: int = 100) -> list[dict[str, Any]]:
        """Получить список элементов telemetry_legacy"""
        return await self.repo.list_items(limit=limit)

    async def count(self) -> int:
        """Получить количество элементов"""
        return await self.repo.count()


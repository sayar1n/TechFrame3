from app.state.app_state import app_state
from app.repo.telemetry_repo import TelemetryRepo
from app.services.telemetry_service import TelemetryService
from app.utils.errors import InternalServerError
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any


async def telemetry_list_handler(
    session: AsyncSession,
    limit: int = 100,
) -> dict[str, Any]:
    """Получить список элементов telemetry_legacy"""
    try:
        repo = TelemetryRepo(session)
        service = TelemetryService(repo)
        items = await service.list_items(limit=limit)
        count = await service.count()

        return {
            "items": items,
            "count": count,
            "limit": limit,
        }
    except Exception as e:
        raise InternalServerError(detail=f"Error fetching telemetry data: {str(e)}")


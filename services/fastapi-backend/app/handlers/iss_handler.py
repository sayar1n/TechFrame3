from app.state.app_state import app_state
from app.repo.iss_repo import IssRepo
from app.clients.iss_client import IssClient
from app.services.iss_service import IssService
from app.domain.models import IssLastResponse, IssTrendResponse
from app.utils.errors import ApiError, InternalServerError
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any


async def last_iss_handler(session: AsyncSession) -> IssLastResponse:
    """Получить последние данные ISS"""
    try:
        repo = IssRepo(session)
        client = IssClient()
        service = IssService(repo, client)
        result = await service.get_last()
        
        if "message" in result:
            # Если данных нет, пытаемся получить их из API
            try:
                await service.fetch_and_store()
                result = await service.get_last()
            except Exception as fetch_error:
                # Если не удалось получить, возвращаем сообщение
                return IssLastResponse(message=result.get("message", "no data"))
        
        return IssLastResponse(
            id=result.get("id"),
            fetched_at=result.get("fetched_at"),
            source_url=result.get("source_url"),
            payload=result.get("payload"),
        )
    except Exception as e:
        raise InternalServerError(detail=f"Error fetching ISS data: {str(e)}")


async def trigger_iss_handler(session: AsyncSession) -> IssLastResponse:
    """Триггер для получения и сохранения данных ISS"""
    try:
        repo = IssRepo(session)
        client = IssClient()
        service = IssService(repo, client)
        
        # Получаем и сохраняем данные
        await service.fetch_and_store()
        
        # Возвращаем последние данные
        return await last_iss_handler(session)
    except Exception as e:
        raise InternalServerError(detail=f"Error triggering ISS fetch: {str(e)}")


async def iss_trend_handler(
    session: AsyncSession,
    limit: int = 240,
) -> dict[str, Any]:
    """Получить тренд движения ISS"""
    try:
        repo = IssRepo(session)
        client = IssClient()
        service = IssService(repo, client)
        result = await service.calculate_trend(limit=limit)
        
        # Возвращаем dict для совместимости с фронтендом (points не в IssTrendResponse)
        return result
    except Exception as e:
        raise InternalServerError(detail=f"Error calculating ISS trend: {str(e)}")


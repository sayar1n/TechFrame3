from fastapi import APIRouter, Query
from app.handlers.space_handler import space_latest_handler, space_refresh_handler, space_summary_handler
from app.domain.models import SpaceLatestResponse, SpaceRefreshResponse, SpaceSummaryResponse

router = APIRouter()


@router.get("/space/{source}/latest", response_model=SpaceLatestResponse)
async def latest(source: str):
    """Получить последние данные из кэша по источнику"""
    return await space_latest_handler(source)


@router.get("/space/refresh", response_model=SpaceRefreshResponse)
async def refresh(src: str = Query("apod,neo,flr,cme,spacex", description="Список источников через запятую")):
    """Обновить кэш для указанных источников"""
    return await space_refresh_handler(src)


@router.get("/space/summary", response_model=SpaceSummaryResponse)
async def summary():
    """Получить сводку всех космических данных"""
    return await space_summary_handler()


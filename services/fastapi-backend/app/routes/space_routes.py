from fastapi import APIRouter, Query, Request
from app.handlers.space_handler import space_latest_handler, space_refresh_handler, space_summary_handler
from app.domain.models import SpaceLatestResponse, SpaceRefreshResponse, SpaceSummaryResponse
from app.middleware.rate_limit import limiter

router = APIRouter()


@router.get("/space/{source}/latest", response_model=SpaceLatestResponse)
@limiter.limit("100/minute")
async def latest(request: Request, source: str):
    """Получить последние данные из кэша по источнику"""
    return await space_latest_handler(source)


@router.get("/space/refresh", response_model=SpaceRefreshResponse)
@limiter.limit("10/minute")
async def refresh(request: Request, src: str = Query("apod,neo,flr,cme,spacex", description="Список источников через запятую")):
    """Обновить кэш для указанных источников"""
    return await space_refresh_handler(src)


@router.get("/space/summary", response_model=SpaceSummaryResponse)
@limiter.limit("100/minute")
async def summary(request: Request):
    """Получить сводку всех космических данных"""
    return await space_summary_handler()


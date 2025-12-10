from fastapi import APIRouter, Request
from app.handlers.iss_handler import last_iss_handler, trigger_iss_handler, iss_trend_handler, clear_iss_data_handler
from app.domain.models import IssLastResponse, IssTrendResponse
from app.middleware.rate_limit import limiter

router = APIRouter()


@router.get("/last", response_model=IssLastResponse)
@limiter.limit("30/minute")
async def last(request: Request):
    """Получить последние данные ISS"""
    from app.state.app_state import app_state
    session_factory = await app_state.get_db()
    async with session_factory() as session:
        return await last_iss_handler(session)


@router.get("/fetch", response_model=IssLastResponse)
@limiter.limit("10/minute")
async def fetch(request: Request):
    """Триггер для получения данных ISS"""
    from app.state.app_state import app_state
    session_factory = await app_state.get_db()
    async with session_factory() as session:
        return await trigger_iss_handler(session)


@router.get("/trend")
@limiter.limit("30/minute")
async def trend(request: Request, limit: int = 240):
    """Получить тренд движения ISS"""
    from app.state.app_state import app_state
    session_factory = await app_state.get_db()
    async with session_factory() as session:
        return await iss_trend_handler(session=session, limit=limit)


@router.delete("/clear")
@limiter.limit("5/minute")
async def clear(request: Request):
    """Очистить все данные ISS из базы"""
    from app.state.app_state import app_state
    session_factory = await app_state.get_db()
    async with session_factory() as session:
        return await clear_iss_data_handler(session)


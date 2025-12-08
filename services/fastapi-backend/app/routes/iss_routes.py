from fastapi import APIRouter
from app.handlers.iss_handler import last_iss_handler, trigger_iss_handler, iss_trend_handler
from app.domain.models import IssLastResponse, IssTrendResponse

router = APIRouter()


@router.get("/last", response_model=IssLastResponse)
async def last():
    """Получить последние данные ISS"""
    from app.state.app_state import app_state
    session_factory = await app_state.get_db()
    async with session_factory() as session:
        return await last_iss_handler(session)


@router.get("/fetch", response_model=IssLastResponse)
async def fetch():
    """Триггер для получения данных ISS"""
    from app.state.app_state import app_state
    session_factory = await app_state.get_db()
    async with session_factory() as session:
        return await trigger_iss_handler(session)


@router.get("/iss/trend")
async def trend(limit: int = 240):
    """Получить тренд движения ISS"""
    from app.state.app_state import app_state
    session_factory = await app_state.get_db()
    async with session_factory() as session:
        return await iss_trend_handler(session=session, limit=limit)


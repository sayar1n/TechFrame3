from fastapi import APIRouter
from typing import Optional
from app.handlers.osdr_handler import osdr_sync_handler, osdr_list_handler
from app.domain.models import OsdrSyncResponse, OsdrListResponse

router = APIRouter()


@router.get("/osdr/sync", response_model=OsdrSyncResponse)
async def sync():
    """Синхронизировать данные OSDR"""
    from app.state.app_state import app_state
    session_factory = await app_state.get_db()
    async with session_factory() as session:
        return await osdr_sync_handler(session)


@router.get("/osdr/list", response_model=OsdrListResponse)
async def list(limit: int = 20, search: Optional[str] = None):
    from app.state.app_state import app_state
    session_factory = await app_state.get_db()
    async with session_factory() as session:
        return await osdr_list_handler(session, limit=limit, search=search)


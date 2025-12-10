from fastapi import APIRouter, Request
from typing import Optional
from app.handlers.osdr_handler import osdr_sync_handler, osdr_list_handler
from app.domain.models import OsdrSyncResponse, OsdrListResponse
from app.middleware.rate_limit import limiter

router = APIRouter()


@router.get("/osdr/sync", response_model=OsdrSyncResponse)
@limiter.limit("5/minute")
async def sync(request: Request):
    """Синхронизировать данные OSDR"""
    from app.state.app_state import app_state
    session_factory = await app_state.get_db()
    async with session_factory() as session:
        return await osdr_sync_handler(session)


@router.get("/osdr/list", response_model=OsdrListResponse)
@limiter.limit("20/minute")
async def list(request: Request, limit: int = 20, search: Optional[str] = None):
    from app.state.app_state import app_state
    session_factory = await app_state.get_db()
    async with session_factory() as session:
        return await osdr_list_handler(session, limit=limit, search=search)


from fastapi import APIRouter, Query
from app.handlers.telemetry_handler import telemetry_list_handler
from app.state.app_state import app_state
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

router = APIRouter()


@router.get("/telemetry/list")
async def list(
    limit: int = Query(default=100, ge=1, le=1000),
) -> dict[str, Any]:
    """Получить список элементов telemetry_legacy"""
    session_factory = await app_state.get_db()
    async with session_factory() as session:
        return await telemetry_list_handler(session, limit=limit)


from fastapi import APIRouter, Query
from app.handlers.jwst_handler import jwst_feed_handler

router = APIRouter()


@router.get("/jwst/feed")
async def feed(
    source: str = Query("jpg", description="Источник: jpg, suffix, program"),
    suffix: str | None = Query(None, description="Суффикс для фильтрации"),
    program: str | None = Query(None, description="ID программы"),
    instrument: str | None = Query(None, description="Инструмент: NIRCam, MIRI, NIRISS, NIRSpec, FGS"),
    page: int = Query(1, ge=1),
    perPage: int = Query(24, ge=1, le=100),
):
    """Получить ленту изображений JWST"""
    return await jwst_feed_handler(
        source=source,
        suffix=suffix,
        program=program,
        instrument=instrument,
        page=page,
        perPage=perPage,
    )


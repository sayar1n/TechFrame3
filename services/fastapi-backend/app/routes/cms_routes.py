from fastapi import APIRouter, Query
from app.handlers.cms_handler import get_cms_block

router = APIRouter()


@router.get("/cms/block")
async def block(slug: str = Query("dashboard_experiment", description="Slug CMS блока")):
    """Получить CMS блок по slug"""
    result = await get_cms_block(slug)
    if result:
        return result
    return {"content": None, "message": "block not found"}


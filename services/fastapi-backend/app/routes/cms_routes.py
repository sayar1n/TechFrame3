from fastapi import APIRouter, Query, Request
from app.handlers.cms_handler import get_cms_block
from app.middleware.rate_limit import limiter

router = APIRouter()


@router.get("/cms/block")
@limiter.limit("30/minute")
async def block(request: Request, slug: str = Query("dashboard_experiment", description="Slug CMS блока")):
    """Получить CMS блок по slug"""
    result = await get_cms_block(slug)
    if result:
        return result
    return {"content": None, "message": "block not found"}


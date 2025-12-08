from app.state.app_state import app_state
from app.utils.errors import ApiError, InternalServerError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any


async def get_cms_block(slug: str) -> dict[str, Any] | None:
    """Получить CMS блок по slug"""
    import logging
    logger = logging.getLogger(__name__)
    
    session_factory = await app_state.get_db()
    async with session_factory() as session:
        try:
            result = await session.execute(
                text("""
                    SELECT content FROM cms_blocks 
                    WHERE slug = :slug AND is_active = TRUE 
                    LIMIT 1
                """),
                {"slug": slug}
            )
            row = result.fetchone()
            if row:
                logger.info(f"Found CMS block for slug: {slug}")
                return {"content": row[0]}
            else:
                logger.warning(f"CMS block not found for slug: {slug}")
                return None
        except Exception as e:
            logger.error(f"Error fetching CMS block for slug {slug}: {e}", exc_info=True)
            return None


from app.state.app_state import app_state
from app.clients.jwst_client import JwstClient
from app.services.jwst_service import JwstService
from app.utils.errors import ApiError, InternalServerError
from app.utils.jwst_helpers import pick_image_url
from typing import Any
import re
import logging

logger = logging.getLogger(__name__)


async def jwst_feed_handler(
    source: str = "jpg",
    suffix: str | None = None,
    program: str | None = None,
    instrument: str | None = None,
    page: int = 1,
    perPage: int = 24,
) -> dict[str, Any]:
    """Получить ленту изображений JWST"""
    try:
        client = JwstClient()
        service = JwstService(client)
        
        params: dict[str, Any] = {
            "source": source,
            "page": page,
            "perPage": perPage,
        }
        
        if suffix:
            params["suffix"] = suffix
        if program:
            params["program"] = program
        if instrument:
            params["instrument"] = instrument
        
        data = await service.fetch_feed(params)
        
        # Если есть ошибка (и она не пустая), возвращаем пустой список
        if isinstance(data, dict) and "error" in data:
            error_msg = data.get("error", "")
            # Проверяем, что ошибка не пустая (может быть пустой строкой или None)
            if error_msg and str(error_msg).strip():
                logger.warning(f"JWST API error: {error_msg}")
                return {
                    "items": [],
                    "source": source,
                    "count": 0,
                    "error": error_msg,
                }
        
        # Извлекаем список из body или data
        list_data = []
        if isinstance(data, dict):
            # Проверяем body (приоритет)
            if "body" in data:
                body = data["body"]
                if isinstance(body, list):
                    list_data = body
                elif isinstance(body, dict) and "data" in body:
                    list_data = body["data"] if isinstance(body["data"], list) else []
            # Проверяем data
            if not list_data and "data" in data:
                list_data = data["data"] if isinstance(data["data"], list) else []
            # Проверяем items
            if not list_data and "items" in data:
                list_data = data["items"] if isinstance(data["items"], list) else []
        elif isinstance(data, list):
            list_data = data
        
        logger.info(f"JWST: extracted {len(list_data)} items from API response")
        
        if not list_data:
            logger.warning(f"JWST: No items found in API response. Data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            return {
                "items": [],
                "source": source,
                "count": 0,
                "error": "No items found in API response"
            }
        
        normalized_items = []
        instrument_filter = instrument.upper() if instrument else None
        
        for idx, it in enumerate(list_data):
            if not isinstance(it, dict):
                logger.debug(f"JWST: Item {idx} is not a dict, skipping")
                continue
            
            # Поиск URL изображения - точно как в оригинальном PHP коде
            # В PHP: сначала проверяются location и thumbnail, потом pickImageUrl()
            url = None
            loc = it.get("location") or it.get("url") or it.get("href") or it.get("link")
            thumb = it.get("thumbnail") or it.get("thumbnailUrl") or it.get("thumb")
            
            logger.debug(f"JWST: Item {idx} - location: {loc[:50] if loc else 'None'}, thumbnail: {thumb[:50] if thumb else 'None'}")
            
            # Проверяем location и thumbnail на наличие расширений изображений
            # В PHP: preg_match('~\.(jpg|jpeg|png)(\?.*)?$~i', $u)
            for u in [loc, thumb]:
                if isinstance(u, str) and u.strip():
                    u_clean = u.strip()
                    # Регулярное выражение как в PHP: ~\.(jpg|jpeg|png)(\?.*)?$~i
                    if re.search(r'\.(jpg|jpeg|png)(\?.*)?$', u_clean, re.IGNORECASE):
                        url = u_clean
                        logger.debug(f"JWST: Item {idx} - Found URL in location/thumbnail: {url[:50]}")
                        break
            
            # Если не нашли, используем рекурсивный поиск (как в оригинале)
            if not url:
                url = pick_image_url(it)
                if url:
                    logger.debug(f"JWST: Item {idx} - Found URL via pick_image_url: {url[:50]}")
            
            if not url:
                logger.debug(f"JWST: Item {idx} - No URL found, skipping")
                continue
            
            # Фильтр по инструменту
            if instrument_filter:
                inst_list = []
                for inst in it.get("details", {}).get("instruments", []):
                    if isinstance(inst, dict) and inst.get("instrument"):
                        inst_list.append(inst["instrument"].upper())
                if inst_list and instrument_filter not in inst_list:
                    continue
            
            # Формируем caption
            obs_id = str(it.get("observation_id") or it.get("observationId") or it.get("id") or "")
            prog = str(it.get("program") or "")
            sfx = str(it.get("details", {}).get("suffix") or it.get("suffix") or "")
            inst_list = []
            for inst in it.get("details", {}).get("instruments", []):
                if isinstance(inst, dict) and inst.get("instrument"):
                    inst_list.append(inst["instrument"])
            
            caption_parts = []
            if obs_id:
                caption_parts.append(obs_id)
            if prog:
                caption_parts.append(f"P{prog}")
            if sfx:
                caption_parts.append(sfx)
            if inst_list:
                caption_parts.append("/".join(inst_list))
            
            normalized_items.append({
                "url": url,
                "link": loc or url,
                "caption": " · ".join(caption_parts) if caption_parts else "",
            })
            
            if len(normalized_items) >= perPage:
                break
        
        return {
            "items": normalized_items,
            "source": source,
            "count": len(normalized_items),
        }
    except Exception as e:
        # Возвращаем ошибку в формате, понятном фронтенду
        return {
            "items": [],
            "source": source,
            "count": 0,
            "error": str(e),
        }




from fastapi import Request, status
from fastapi.responses import JSONResponse
from app.utils.errors import ApiError
import logging
import uuid

logger = logging.getLogger(__name__)


async def error_handler(request: Request, call_next):
    """Глобальный обработчик ошибок"""
    try:
        response = await call_next(request)
        return response
    except ApiError as e:
        trace_id = str(uuid.uuid4())
        logger.error(f"API Error [{trace_id}]: {e.detail}", exc_info=True)
        
        return JSONResponse(
            status_code=e.status_code,
            content={
                "ok": False,
                "error": {
                    "code": e.code,
                    "message": e.detail or "An error occurred",
                    "trace_id": trace_id,
                }
            }
        )
    except Exception as e:
        trace_id = str(uuid.uuid4())
        logger.error(f"Unhandled error [{trace_id}]: {str(e)}", exc_info=True)
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "ok": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Internal server error",
                    "trace_id": trace_id,
                }
            }
        )


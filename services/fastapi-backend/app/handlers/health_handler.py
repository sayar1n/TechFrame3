from datetime import datetime
from app.domain.models import HealthResponse
from app.utils.errors import ApiError


async def health_handler() -> HealthResponse:
    """Health check эндпоинт"""
    return HealthResponse(
        status="ok",
        now=datetime.utcnow()
    )


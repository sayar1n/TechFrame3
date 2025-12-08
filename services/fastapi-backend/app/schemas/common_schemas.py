from typing import Any, Optional
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    """Стандартный формат ошибки"""
    ok: bool = False
    error: dict[str, Any]


class SuccessResponse(BaseModel):
    """Стандартный формат успешного ответа"""
    ok: bool = True
    data: Optional[dict[str, Any]] = None


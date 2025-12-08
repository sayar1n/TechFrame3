from fastapi import HTTPException, status
from typing import Optional


class ApiError(HTTPException):
    """Базовый класс для ошибок API"""
    
    def __init__(
        self,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail: Optional[str] = None,
        code: Optional[str] = None,
        trace_id: Optional[str] = None,
    ):
        self.code = code or f"HTTP_{status_code}"
        self.trace_id = trace_id
        super().__init__(status_code=status_code, detail=detail)


class NotFoundError(ApiError):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            code="NOT_FOUND",
        )


class InternalServerError(ApiError):
    def __init__(self, detail: str = "Internal server error"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
            code="INTERNAL_ERROR",
        )


class UpstreamError(ApiError):
    def __init__(self, detail: str, upstream_code: Optional[str] = None):
        code = upstream_code or "UPSTREAM_ERROR"
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=detail,
            code=code,
        )


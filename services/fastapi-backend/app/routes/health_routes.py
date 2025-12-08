from fastapi import APIRouter
from app.handlers.health_handler import health_handler

router = APIRouter()


@router.get("/health", response_model=None)
async def health():
    """Health check endpoint"""
    return await health_handler()


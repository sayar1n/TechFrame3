from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from app.database.connection import get_db_pool
from app.config.settings import settings
import redis.asyncio as aioredis
from typing import Optional


class AppState:
    def __init__(self):
        self._db_pool: Optional[async_sessionmaker[AsyncSession]] = None
        self._redis: Optional[aioredis.Redis] = None
        self.settings = settings
    
    async def get_db(self):
        """Получить фабрику сессий БД (async_sessionmaker)"""
        if self._db_pool is None:
            self._db_pool = await get_db_pool()
        return self._db_pool
    
    async def get_redis(self) -> aioredis.Redis:
        """Получить соединение с Redis"""
        if self._redis is None:
            redis_url = settings.redis_url or "redis://redis:6379/0"
            self._redis = await aioredis.from_url(
                redis_url,
                decode_responses=True
            )
        return self._redis
    
    async def close(self):
        """Закрыть соединения"""
        if self._redis:
            await self._redis.close()
            self._redis = None
        # БД пул закрывается автоматически при завершении приложения


app_state = AppState()


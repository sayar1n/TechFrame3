from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import hashlib


def get_lock_key(task_name: str) -> int:
    """Получить числовой ключ для advisory lock на основе имени задачи"""
    # Используем хэш для получения числового ключа
    hash_obj = hashlib.md5(task_name.encode())
    # Берем первые 8 байт и преобразуем в int (PostgreSQL advisory lock использует bigint)
    return int.from_bytes(hash_obj.digest()[:8], byteorder='big', signed=True)


@asynccontextmanager
async def advisory_lock(session: AsyncSession, task_name: str) -> AsyncGenerator[bool, None]:
    """
    Контекстный менеджер для PostgreSQL advisory lock.
    Защищает от наложения задач планировщика.
    
    Args:
        session: Сессия БД
        task_name: Имя задачи (например, "iss_fetch", "osdr_sync")
    
    Yields:
        bool: True если блокировка получена, False если нет
    """
    lock_key = get_lock_key(task_name)
    locked = False
    
    try:
        # Пытаемся получить блокировку (неблокирующий режим)
        result = await session.execute(
            text("SELECT pg_try_advisory_lock(:lock_key)"),
            {"lock_key": lock_key}
        )
        locked = result.scalar()
        
        if not locked:
            # Блокировка не получена - задача уже выполняется
            yield False
            return
        
        # Блокировка получена - выполняем задачу
        yield True
        
    finally:
        # Освобождаем блокировку если она была получена
        if locked:
            try:
                await session.execute(
                    text("SELECT pg_advisory_unlock(:lock_key)"),
                    {"lock_key": lock_key}
                )
            except Exception:
                # Игнорируем ошибки при освобождении блокировки
                pass


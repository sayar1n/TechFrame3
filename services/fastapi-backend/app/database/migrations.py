"""
Миграции базы данных
Выполняются при старте приложения для обновления схемы существующих таблиц
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import logging

logger = logging.getLogger(__name__)


async def run_migrations(session: AsyncSession):
    """Выполнить миграции базы данных"""
    try:
        # Миграция: добавление колонок status и rest_url в osdr_items
        await session.execute(text("""
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'osdr_items' 
                    AND column_name = 'status'
                ) THEN
                    ALTER TABLE osdr_items ADD COLUMN status TEXT;
                    RAISE NOTICE 'Added column status to osdr_items';
                END IF;
                
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'osdr_items' 
                    AND column_name = 'rest_url'
                ) THEN
                    ALTER TABLE osdr_items ADD COLUMN rest_url TEXT;
                    RAISE NOTICE 'Added column rest_url to osdr_items';
                END IF;
            END $$;
        """))
        await session.commit()
        logger.info("Database migrations completed successfully")
    except Exception as e:
        await session.rollback()
        logger.error(f"Error running migrations: {e}")
        # Не выбрасываем исключение, чтобы приложение могло запуститься
        # даже если миграция не удалась (колонки уже могут существовать)


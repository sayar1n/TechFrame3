from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config.settings import settings

Base = declarative_base()

_engine = None
_session_factory = None


async def get_db_pool() -> async_sessionmaker[AsyncSession]:
    """Получить пул соединений с БД"""
    global _engine, _session_factory
    
    if _engine is None:
        # Преобразуем postgresql:// в postgresql+asyncpg://
        db_url = settings.database_url
        if db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif not db_url.startswith("postgresql+asyncpg://"):
            db_url = f"postgresql+asyncpg://{db_url}"
        
        _engine = create_async_engine(
            db_url,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,  # Проверка соединений перед использованием
            pool_recycle=3600,   # Переподключение каждые 3600 секунд
            echo=False,
        )
        _session_factory = async_sessionmaker(
            _engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
    
    return _session_factory


async def init_db():
    """
    Инициализация таблиц БД.
    
    Создает таблицы для:
    - iss_fetch_log: логи получения данных ISS (TIMESTAMPTZ для fetched_at)
    - osdr_items: элементы OSDR с Upsert по dataset_id (TIMESTAMPTZ для updated_at, inserted_at)
    - space_cache: универсальный кэш космических данных (TIMESTAMPTZ для fetched_at)
    
    Все даты используют TIMESTAMPTZ для корректной работы с timezone.
    """
    from sqlalchemy import text
    import logging
    
    logger = logging.getLogger(__name__)
    
    session_factory = await get_db_pool()
    async with session_factory() as session:
        try:
            # ISS таблица
            await session.execute(text("""
                CREATE TABLE IF NOT EXISTS iss_fetch_log(
                    id BIGSERIAL PRIMARY KEY,
                    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                    source_url TEXT NOT NULL,
                    payload JSONB NOT NULL
                )
            """))
            
            # OSDR таблица
            await session.execute(text("""
                CREATE TABLE IF NOT EXISTS osdr_items(
                    id BIGSERIAL PRIMARY KEY,
                    dataset_id TEXT,
                    title TEXT,
                    updated_at TIMESTAMPTZ,
                    inserted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                    raw JSONB NOT NULL
                )
            """))
            
            # Добавляем колонки если их нет (миграция для существующих таблиц)
            # Проверяем и добавляем колонки по отдельности для лучшей обработки ошибок
            try:
                # Проверяем наличие колонки status
                result = await session.execute(text("""
                    SELECT COUNT(*) FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'osdr_items' 
                    AND column_name = 'status'
                """))
                has_status = result.scalar() > 0
                
                if not has_status:
                    await session.execute(text("ALTER TABLE osdr_items ADD COLUMN status TEXT"))
                    logger.info("Added column 'status' to osdr_items")
            except Exception as e:
                logger.warning(f"Could not add 'status' column: {e}")
            
            try:
                # Проверяем наличие колонки rest_url
                result = await session.execute(text("""
                    SELECT COUNT(*) FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'osdr_items' 
                    AND column_name = 'rest_url'
                """))
                has_rest_url = result.scalar() > 0
                
                if not has_rest_url:
                    await session.execute(text("ALTER TABLE osdr_items ADD COLUMN rest_url TEXT"))
                    logger.info("Added column 'rest_url' to osdr_items")
            except Exception as e:
                logger.warning(f"Could not add 'rest_url' column: {e}")
            
            await session.execute(text("""
                CREATE UNIQUE INDEX IF NOT EXISTS ux_osdr_dataset_id
                ON osdr_items(dataset_id) WHERE dataset_id IS NOT NULL
            """))
            
            # Space cache таблица
            await session.execute(text("""
                CREATE TABLE IF NOT EXISTS space_cache(
                    id BIGSERIAL PRIMARY KEY,
                    source TEXT NOT NULL,
                    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                    payload JSONB NOT NULL
                )
            """))
            await session.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_space_cache_source 
                ON space_cache(source, fetched_at DESC)
            """))
            
            # Telemetry legacy таблица
            await session.execute(text("""
                CREATE TABLE IF NOT EXISTS telemetry_legacy(
                    id BIGSERIAL PRIMARY KEY,
                    recorded_at TIMESTAMPTZ NOT NULL,
                    voltage NUMERIC(6,2) NOT NULL,
                    temp NUMERIC(6,2) NOT NULL,
                    source_file TEXT NOT NULL
                )
            """))
            
            # CMS блоки таблица
            await session.execute(text("""
                CREATE TABLE IF NOT EXISTS cms_blocks(
                    id BIGSERIAL PRIMARY KEY,
                    slug TEXT UNIQUE NOT NULL,
                    content TEXT NOT NULL,
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
                )
            """))
            await session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_cms_blocks_slug_active 
                ON cms_blocks(slug, is_active)
            """))
            
            # CMS страницы таблица
            await session.execute(text("""
                CREATE TABLE IF NOT EXISTS cms_pages(
                    id BIGSERIAL PRIMARY KEY,
                    slug TEXT UNIQUE NOT NULL,
                    title TEXT NOT NULL,
                    body TEXT NOT NULL
                )
            """))
            
            # Вставляем демо данные для CMS блоков
            await session.execute(text("""
                INSERT INTO cms_blocks(slug, content, is_active)
                VALUES ('dashboard_experiment', '<div class="alert alert-info">Это CMS блок из базы данных</div>', TRUE)
                ON CONFLICT (slug) DO NOTHING
            """))
            
            await session.commit()
        except Exception as e:
            await session.rollback()
            raise


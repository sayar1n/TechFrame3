import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.database.connection import init_db
from app.state.app_state import app_state
from app.services.scheduler_service import SchedulerService
from app.middleware.error_handler import error_handler
from app.middleware.rate_limit import limiter, rate_limit_handler
from slowapi.errors import RateLimitExceeded
from app.routes import health_routes, iss_routes, osdr_routes, space_routes, jwst_routes, astronomy_routes, cms_routes, telemetry_routes

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Инициализация планировщика
scheduler = SchedulerService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Управление жизненным циклом приложения"""
    # Startup
    logger.info("Starting FastAPI application...")
    
    # Инициализация БД
    await init_db()
    logger.info("Database initialized")
    
    # Запуск планировщика
    await scheduler.start()
    logger.info("Scheduler started")
    
    yield
    
    # Shutdown
    logger.info("Shutting down FastAPI application...")
    await scheduler.stop()
    await app_state.close()
    logger.info("Application stopped")


# Создание FastAPI приложения
app = FastAPI(
    title="Space Dashboard API",
    description="API для сбора и управления космическими данными",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Error handler middleware
app.middleware("http")(error_handler)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)

# Подключение роутов
app.include_router(health_routes.router, tags=["Health"])
app.include_router(iss_routes.router, tags=["ISS"])
app.include_router(osdr_routes.router, tags=["OSDR"])
app.include_router(space_routes.router, tags=["Space"])
app.include_router(jwst_routes.router, tags=["JWST"])
app.include_router(astronomy_routes.router, tags=["Astronomy"])
app.include_router(cms_routes.router, tags=["CMS"])
app.include_router(telemetry_routes.router, tags=["Telemetry"])


@app.get("/")
async def root():
    """Корневой эндпоинт"""
    return {
        "message": "Space Dashboard API",
        "version": "1.0.0",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )


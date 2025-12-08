from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    database_url: str
    
    # Redis
    redis_url: Optional[str] = "redis://redis:6379/0"
    
    # NASA API
    nasa_api_url: str = "https://visualization.osdr.nasa.gov/biodata/api/v2/datasets/?format=json"
    nasa_api_key: Optional[str] = ""
    
    # ISS API
    where_iss_url: str = "https://api.wheretheiss.at/v1/satellites/25544"
    
    # JWST API
    jwst_host: Optional[str] = "https://api.jwstapi.com"
    jwst_api_key: Optional[str] = ""
    jwst_email: Optional[str] = ""
    jwst_program_id: Optional[str] = "2734"
    
    # Astronomy API
    astro_app_id: Optional[str] = ""
    astro_app_secret: Optional[str] = ""
    
    # Scheduler intervals (seconds)
    fetch_every_seconds: int = 600  # OSDR
    iss_every_seconds: int = 120
    apod_every_seconds: int = 43200  # 12 hours
    neo_every_seconds: int = 7200  # 2 hours
    donki_every_seconds: int = 3600  # 1 hour
    spacex_every_seconds: int = 3600  # 1 hour
    
    # CORS - принимаем строку и парсим в список
    cors_origins: str = "http://localhost:8080"
    
    def get_cors_origins_list(self) -> list[str]:
        """Получить список CORS origins"""
        if isinstance(self.cors_origins, str):
            return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        return self.cors_origins if isinstance(self.cors_origins, list) else ["http://localhost:8080"]
    
    # API timeouts
    api_timeout: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()


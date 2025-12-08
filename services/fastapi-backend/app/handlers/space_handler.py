from app.state.app_state import app_state
from app.repo.cache_repo import CacheRepo
from app.repo.iss_repo import IssRepo
from app.repo.osdr_repo import OsdrRepo
from app.clients.nasa_client import NasaClient
from app.domain.models import SpaceLatestResponse, SpaceRefreshResponse, SpaceSummaryResponse
from app.utils.errors import ApiError, InternalServerError
from fastapi import Query




async def space_latest_handler(
    source: str,
) -> SpaceLatestResponse:
    """Получить последние данные из кэша по источнику"""
    try:
        session_factory = await app_state.get_db()
        async with session_factory() as session:
            repo = CacheRepo(session)
            result = await repo.get_latest(source)
            
            if not result:
                return SpaceLatestResponse(source=source, message="no data")
            
            return SpaceLatestResponse(
                source=source,
                fetched_at=result.get("fetched_at"),
                payload=result.get("payload"),
            )
    except Exception as e:
        raise InternalServerError(detail=f"Error fetching space cache: {str(e)}")


async def space_refresh_handler(
    src: str = "apod,neo,flr,cme,spacex",
) -> SpaceRefreshResponse:
    """Обновить кэш для указанных источников"""
    try:
        session_factory = await app_state.get_db()
        async with session_factory() as session:
            repo = CacheRepo(session)
            client = NasaClient()
            refreshed = []
            
            sources = [s.strip().lower() for s in src.split(",")]
            
            for source in sources:
                try:
                    if source == "apod":
                        data = await client.fetch_apod()
                        await repo.insert_cache("apod", data)
                        refreshed.append("apod")
                    elif source == "neo":
                        data = await client.fetch_neo_feed()
                        await repo.insert_cache("neo", data)
                        refreshed.append("neo")
                    elif source == "flr":
                        data = await client.fetch_donki_flr()
                        await repo.insert_cache("flr", data)
                        refreshed.append("flr")
                    elif source == "cme":
                        data = await client.fetch_donki_cme()
                        await repo.insert_cache("cme", data)
                        refreshed.append("cme")
                    elif source == "spacex":
                        data = await client.fetch_spacex_next()
                        await repo.insert_cache("spacex", data)
                        refreshed.append("spacex")
                except Exception as e:
                    # Продолжаем обработку других источников при ошибке
                    continue
            
            return SpaceRefreshResponse(refreshed=refreshed)
    except Exception as e:
        raise InternalServerError(detail=f"Error refreshing space cache: {str(e)}")


async def space_summary_handler() -> SpaceSummaryResponse:
    """Получить сводку всех космических данных"""
    try:
        session_factory = await app_state.get_db()
        async with session_factory() as session:
            cache_repo = CacheRepo(session)
            iss_repo = IssRepo(session)
            osdr_repo = OsdrRepo(session)
            
            # Получаем данные из кэша
            apod_data = await cache_repo.get_latest("apod")
            neo_data = await cache_repo.get_latest("neo")
            flr_data = await cache_repo.get_latest("flr")
            cme_data = await cache_repo.get_latest("cme")
            spacex_data = await cache_repo.get_latest("spacex")
            
            # Получаем последние данные ISS
            iss_last = await iss_repo.get_last()
            
            # Получаем количество OSDR элементов
            osdr_count = await osdr_repo.count()
            
            return SpaceSummaryResponse(
                apod={
                    "at": apod_data["fetched_at"] if apod_data else None,
                    "payload": apod_data["payload"] if apod_data else {}
                },
                neo={
                    "at": neo_data["fetched_at"] if neo_data else None,
                    "payload": neo_data["payload"] if neo_data else {}
                },
                flr={
                    "at": flr_data["fetched_at"] if flr_data else None,
                    "payload": flr_data["payload"] if flr_data else {}
                },
                cme={
                    "at": cme_data["fetched_at"] if cme_data else None,
                    "payload": cme_data["payload"] if cme_data else {}
                },
                spacex={
                    "at": spacex_data["fetched_at"] if spacex_data else None,
                    "payload": spacex_data["payload"] if spacex_data else {}
                },
                iss={
                    "at": iss_last["fetched_at"] if iss_last else None,
                    "payload": iss_last["payload"] if iss_last else {}
                },
                osdr_count=osdr_count,
            )
    except Exception as e:
        raise InternalServerError(detail=f"Error fetching space summary: {str(e)}")


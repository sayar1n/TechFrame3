import asyncio
from app.state.app_state import app_state
from app.repo.iss_repo import IssRepo
from app.repo.osdr_repo import OsdrRepo
from app.repo.cache_repo import CacheRepo
from app.clients.iss_client import IssClient
from app.clients.osdr_client import OsdrClient
from app.clients.nasa_client import NasaClient
from app.services.iss_service import IssService
from app.services.osdr_service import OsdrService
from app.utils.advisory_lock import advisory_lock
import logging

logger = logging.getLogger(__name__)


class SchedulerService:
    """Сервис для фоновых задач планировщика"""
    
    def __init__(self):
        self.running = False
        self.tasks = []
    
    async def _fetch_iss(self):
        """Фоновая задача для получения данных ISS с защитой от наложения"""
        while self.running:
            try:
                session_factory = await app_state.get_db()
                async with session_factory() as session:
                    async with advisory_lock(session, "iss_fetch") as locked:
                        if not locked:
                            logger.warning("ISS fetch task already running, skipping")
                            await asyncio.sleep(app_state.settings.iss_every_seconds)
                            continue
                        
                        repo = IssRepo(session)
                        client = IssClient()
                        service = IssService(repo, client)
                        await service.fetch_and_store()
                        logger.info("ISS data fetched successfully")
            except Exception as e:
                logger.error(f"Error fetching ISS data: {e}")
            
            await asyncio.sleep(app_state.settings.iss_every_seconds)
    
    async def _fetch_osdr(self):
        """Фоновая задача для получения данных OSDR с защитой от наложения"""
        while self.running:
            try:
                session_factory = await app_state.get_db()
                async with session_factory() as session:
                    async with advisory_lock(session, "osdr_sync") as locked:
                        if not locked:
                            logger.warning("OSDR sync task already running, skipping")
                            await asyncio.sleep(app_state.settings.fetch_every_seconds)
                            continue
                        
                        repo = OsdrRepo(session)
                        client = OsdrClient()
                        service = OsdrService(repo, client)
                        await service.sync_and_store()
                        logger.info("OSDR data synced successfully")
            except Exception as e:
                logger.error(f"Error syncing OSDR data: {e}")
            
            await asyncio.sleep(app_state.settings.fetch_every_seconds)
    
    async def _fetch_apod(self):
        """Фоновая задача для получения APOD с защитой от наложения"""
        while self.running:
            try:
                session_factory = await app_state.get_db()
                async with session_factory() as session:
                    async with advisory_lock(session, "apod_fetch") as locked:
                        if not locked:
                            logger.warning("APOD fetch task already running, skipping")
                            await asyncio.sleep(app_state.settings.apod_every_seconds)
                            continue
                        
                        repo = CacheRepo(session)
                        client = NasaClient()
                        data = await client.fetch_apod()
                        await repo.insert_cache("apod", data)
                        logger.info("APOD data fetched successfully")
            except Exception as e:
                logger.error(f"Error fetching APOD: {e}")
            
            await asyncio.sleep(app_state.settings.apod_every_seconds)
    
    async def _fetch_neo(self):
        """Фоновая задача для получения NEO данных с защитой от наложения"""
        while self.running:
            try:
                session_factory = await app_state.get_db()
                async with session_factory() as session:
                    async with advisory_lock(session, "neo_fetch") as locked:
                        if not locked:
                            logger.warning("NEO fetch task already running, skipping")
                            await asyncio.sleep(app_state.settings.neo_every_seconds)
                            continue
                        
                        repo = CacheRepo(session)
                        client = NasaClient()
                        data = await client.fetch_neo_feed()
                        await repo.insert_cache("neo", data)
                        logger.info("NEO data fetched successfully")
            except Exception as e:
                logger.error(f"Error fetching NEO: {e}")
            
            await asyncio.sleep(app_state.settings.neo_every_seconds)
    
    async def _fetch_donki(self):
        """Фоновая задача для получения DONKI данных с защитой от наложения"""
        while self.running:
            try:
                session_factory = await app_state.get_db()
                async with session_factory() as session:
                    async with advisory_lock(session, "donki_fetch") as locked:
                        if not locked:
                            logger.warning("DONKI fetch task already running, skipping")
                            await asyncio.sleep(app_state.settings.donki_every_seconds)
                            continue
                        
                        repo = CacheRepo(session)
                        client = NasaClient()
                        
                        # FLR
                        try:
                            flr_data = await client.fetch_donki_flr()
                            await repo.insert_cache("flr", flr_data)
                        except Exception as e:
                            logger.error(f"Error fetching DONKI FLR: {e}")
                        
                        # CME
                        try:
                            cme_data = await client.fetch_donki_cme()
                            await repo.insert_cache("cme", cme_data)
                        except Exception as e:
                            logger.error(f"Error fetching DONKI CME: {e}")
                        
                        logger.info("DONKI data fetched successfully")
            except Exception as e:
                logger.error(f"Error fetching DONKI: {e}")
            
            await asyncio.sleep(app_state.settings.donki_every_seconds)
    
    async def _fetch_spacex(self):
        """Фоновая задача для получения SpaceX данных с защитой от наложения"""
        while self.running:
            try:
                session_factory = await app_state.get_db()
                async with session_factory() as session:
                    async with advisory_lock(session, "spacex_fetch") as locked:
                        if not locked:
                            logger.warning("SpaceX fetch task already running, skipping")
                            await asyncio.sleep(app_state.settings.spacex_every_seconds)
                            continue
                        
                        repo = CacheRepo(session)
                        client = NasaClient()
                        data = await client.fetch_spacex_next()
                        await repo.insert_cache("spacex", data)
                        logger.info("SpaceX data fetched successfully")
            except Exception as e:
                logger.error(f"Error fetching SpaceX: {e}")
            
            await asyncio.sleep(app_state.settings.spacex_every_seconds)
    
    async def start(self):
        """Запустить все фоновые задачи"""
        self.running = True
        
        self.tasks = [
            asyncio.create_task(self._fetch_iss()),
            asyncio.create_task(self._fetch_osdr()),
            asyncio.create_task(self._fetch_apod()),
            asyncio.create_task(self._fetch_neo()),
            asyncio.create_task(self._fetch_donki()),
            asyncio.create_task(self._fetch_spacex()),
        ]
        
        logger.info("Scheduler started")
    
    async def stop(self):
        """Остановить все фоновые задачи"""
        self.running = False
        for task in self.tasks:
            task.cancel()
        await asyncio.gather(*self.tasks, return_exceptions=True)
        logger.info("Scheduler stopped")


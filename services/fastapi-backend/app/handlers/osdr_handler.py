from app.state.app_state import app_state
from app.repo.osdr_repo import OsdrRepo
from app.clients.osdr_client import OsdrClient
from app.services.osdr_service import OsdrService
from app.domain.models import OsdrSyncResponse, OsdrListResponse, OsdrItem
from app.utils.errors import ApiError, InternalServerError
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional


async def osdr_sync_handler(session: AsyncSession) -> OsdrSyncResponse:
    """Синхронизировать данные OSDR"""
    try:
        repo = OsdrRepo(session)
        client = OsdrClient()
        service = OsdrService(repo, client)
        written = await service.sync_and_store()
        
        return OsdrSyncResponse(written=written)
    except Exception as e:
        raise InternalServerError(detail=f"Error syncing OSDR data: {str(e)}")


async def osdr_list_handler(
    session: AsyncSession,
    limit: int = 20,
) -> OsdrListResponse:
    """Получить список элементов OSDR"""
    try:
        repo = OsdrRepo(session)
        items = await repo.list_items(limit=limit)
        
        # Если данных нет, пытаемся синхронизировать
        if not items:
            try:
                client = OsdrClient()
                service = OsdrService(repo, client)
                await service.sync_and_store()
                items = await repo.list_items(limit=limit)
            except Exception as sync_error:
                # Если синхронизация не удалась, возвращаем пустой список
                pass
        
        # Обработка OSDR данных: flattenOsdr - преобразует {"OSD-1": {...}} в плоский список
        processed_items = []
        for item in items:
            raw_data = item.get("raw", {})
            
            # Проверяем, является ли raw объектом вида {"OSD-1": {...}, "OSD-2": {...}}
            # В PHP: looksOsdrDict() - проверяет ключи "OSD-xxx" ИЛИ значения содержат REST_URL
            if isinstance(raw_data, dict) and _looks_osdr_dict(raw_data):
                # Разворачиваем объект в отдельные элементы (как в оригинальном flattenOsdr)
                for key, value in raw_data.items():
                    if not isinstance(value, dict):
                        continue
                    
                    # Ищем REST_URL на верхнем уровне датасета
                    rest_url = value.get("REST_URL") or value.get("rest_url") or value.get("rest")
                    
                    # Если REST_URL найден, но это URL assay (содержит /assay/),
                    # преобразуем его в базовый URL датасета
                    if rest_url and isinstance(rest_url, str) and "/assay/" in rest_url:
                        # Извлекаем dataset_id из URL assay
                        # Например: .../dataset/OSD-940/assay/... -> .../dataset/OSD-940/?format=browser
                        try:
                            if "/dataset/" in rest_url:
                                parts = rest_url.split("/dataset/")
                                if len(parts) > 1:
                                    dataset_id = parts[1].split("/")[0]
                                    base_url = parts[0] + "/dataset/" + dataset_id
                                    rest_url = base_url
                        except Exception:
                            pass
                    
                    # Если REST_URL не найден на верхнем уровне, но есть в assays,
                    # строим базовый URL датасета в правильном формате OSDR API
                    if not rest_url and "assays" in value and isinstance(value["assays"], dict):
                        # Извлекаем dataset_id из ключа (например, "OSD-940")
                        # Строим правильный URL: /dataset/{dataset_id}/?format=browser
                        base_url = "https://visualization.osdr.nasa.gov/biodata/api/v2"
                        rest_url = f"{base_url}/dataset/{key}/"
                    
                    # Если REST_URL всё ещё не найден, строим из dataset_id
                    if not rest_url:
                        base_url = "https://visualization.osdr.nasa.gov/biodata/api/v2"
                        rest_url = f"{base_url}/dataset/{key}/"
                    
                    # Убеждаемся, что в конце есть ?format=browser для перенаправления
                    if rest_url and isinstance(rest_url, str):
                        if "?format=" not in rest_url:
                            rest_url = rest_url.rstrip("/") + "/?format=browser"
                        elif "?format=browser" not in rest_url:
                            # Заменяем существующий format на browser
                            rest_url = rest_url.split("?format=")[0] + "?format=browser"
                    
                    title = value.get("title") or value.get("name")
                    
                    # Запасной вариант: последний сегмент URL как подпись (как в PHP: basename())
                    if not title and isinstance(rest_url, str):
                        title = rest_url.rstrip("/").split("/")[-1] if rest_url else None
                    
                    processed_items.append(
                        OsdrItem(
                            id=item["id"],
                            dataset_id=key,  # Используем ключ как dataset_id
                            title=title,
                            status=item.get("status"),
                            rest_url=rest_url,
                            updated_at=item.get("updated_at"),
                            inserted_at=item["inserted_at"],
                            raw=value,  # Вложенный объект как raw
                        )
                    )
            else:
                # Обычная обработка - просто прокинем REST_URL если найдётся
                rest_url = item.get("rest_url")
                if not rest_url and isinstance(raw_data, dict):
                    rest_url = raw_data.get("REST_URL") or raw_data.get("rest_url")
                
                # Если REST_URL найден, но это URL assay, преобразуем в базовый URL датасета
                if rest_url and isinstance(rest_url, str) and "/assay/" in rest_url:
                    try:
                        if "/dataset/" in rest_url:
                            parts = rest_url.split("/dataset/")
                            if len(parts) > 1:
                                dataset_id = parts[1].split("/")[0]
                                base_url = parts[0] + "/dataset/" + dataset_id
                                rest_url = base_url
                    except Exception:
                        pass
                
                # Если REST_URL не найден, но есть dataset_id, строим URL
                if not rest_url and item.get("dataset_id"):
                    base_url = "https://visualization.osdr.nasa.gov/biodata/api/v2"
                    rest_url = f"{base_url}/dataset/{item['dataset_id']}/"
                
                # Убеждаемся, что в конце есть ?format=browser
                if rest_url and isinstance(rest_url, str):
                    if "?format=" not in rest_url:
                        rest_url = rest_url.rstrip("/") + "/?format=browser"
                    elif "?format=browser" not in rest_url:
                        rest_url = rest_url.split("?format=")[0] + "?format=browser"
                
                processed_items.append(
                    OsdrItem(
                        id=item["id"],
                        dataset_id=item.get("dataset_id"),
                        title=item.get("title"),
                        status=item.get("status"),
                        rest_url=rest_url,
                        updated_at=item.get("updated_at"),
                        inserted_at=item["inserted_at"],
                        raw=item["raw"],
                    )
                )
        
        return OsdrListResponse(items=processed_items)
    except Exception as e:
        raise InternalServerError(detail=f"Error fetching OSDR list: {str(e)}")


def _looks_osdr_dict(raw: dict) -> bool:
    """
    Проверяет, является ли словарь объектом вида {"OSD-1": {...}, "OSD-2": {...}}
    
    Точная реализация оригинального looksOsdrDict() из PHP:
    - словарь ключей "OSD-xxx" ИЛИ значения содержат REST_URL
    """
    for key, value in raw.items():
        # Проверяем ключи вида "OSD-xxx"
        if isinstance(key, str) and key.startswith("OSD-"):
            return True
        # Проверяем, содержат ли значения REST_URL
        if isinstance(value, dict) and ("REST_URL" in value or "rest_url" in value):
            return True
    return False


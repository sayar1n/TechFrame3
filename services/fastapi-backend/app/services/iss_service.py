from app.repo.iss_repo import IssRepo
from app.clients.iss_client import IssClient
from app.utils.validators import extract_number, haversine_km
from typing import Any
from datetime import datetime


class IssService:
    """Сервис для работы с данными ISS"""
    
    def __init__(self, repo: IssRepo, client: IssClient):
        self.repo = repo
        self.client = client
    
    async def fetch_and_store(self) -> dict[str, Any]:
        """Получить и сохранить данные ISS"""
        data = await self.client.fetch_current_position()
        source_url = self.client.base_url
        await self.repo.insert_fetch_log(source_url, data)
        return data
    
    async def get_last(self) -> dict[str, Any]:
        """Получить последние данные"""
        result = await self.repo.get_last()
        if result:
            return {
                "id": result["id"],
                "fetched_at": result["fetched_at"],
                "source_url": result["source_url"],
                "payload": result["payload"],
            }
        return {"message": "no data"}
    
    async def calculate_trend(self, limit: int = 240) -> dict[str, Any]:
        """Рассчитать тренд движения ISS"""
        data = await self.repo.get_trend_data(limit=limit)
        
        # Формируем points для фронтенда (от старых к новым)
        points = []
        for item in data:
            payload = item.get("payload", {})
            if isinstance(payload, dict):
                lat = extract_number(payload.get("latitude"))
                lon = extract_number(payload.get("longitude"))
                velocity = extract_number(payload.get("velocity"))
                altitude = extract_number(payload.get("altitude"))
                
                if lat is not None and lon is not None:
                    points.append({
                        "lat": lat,
                        "lon": lon,
                        "at": item.get("fetched_at"),
                        "velocity": velocity,
                        "altitude": altitude,
                    })
        
        if len(points) < 2:
            return {
                "movement": False,
                "delta_km": 0.0,
                "dt_sec": 0.0,
                "velocity_kmh": None,
                "from_time": None,
                "to_time": None,
                "from_lat": None,
                "from_lon": None,
                "to_lat": None,
                "to_lon": None,
                "points": points,
            }
        
        # Первая точка (старая) и последняя (новая)
        p1 = points[0]
        p2 = points[-1]
        
        lat1 = p1["lat"]
        lon1 = p1["lon"]
        lat2 = p2["lat"]
        lon2 = p2["lon"]
        v2 = p2["velocity"]
        
        delta_km = haversine_km(lat1, lon1, lat2, lon2)
        movement = delta_km > 0.1
        
        dt_sec = (p2["at"] - p1["at"]).total_seconds()
        
        return {
            "movement": movement,
            "delta_km": delta_km,
            "dt_sec": dt_sec,
            "velocity_kmh": v2,
            "from_time": p1["at"],
            "to_time": p2["at"],
            "from_lat": lat1,
            "from_lon": lon1,
            "to_lat": lat2,
            "to_lon": lon2,
            "points": points,
        }


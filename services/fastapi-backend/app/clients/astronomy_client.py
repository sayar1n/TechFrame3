import httpx
from typing import Any, Optional
from datetime import datetime, timedelta
from app.config.settings import settings
from app.clients.nasa_client import NasaClient


class AstronomyClient:
    """Клиент для получения космических событий через NASA API"""
    
    def __init__(self):
        self.timeout = settings.api_timeout
        self.nasa_client = NasaClient()
    
    async def get_events(
        self,
        days: int = 7,
        limit: Optional[int] = None
    ) -> dict[str, Any]:
        """
        Получить космические события через NASA Asteroids - NeoWs API
        
        Использует только NEO (околоземные объекты)
        
        Args:
            days: Количество дней от сегодня (1-7, NEO API ограничен 7 днями)
            limit: Максимальное количество событий для возврата (опционально)
        """
        # Ограничиваем дни до 7 (лимит NEO API)
        days = min(max(days, 1), 7)
        
        events = []
        event_number = 1
        
        # Получаем околоземные объекты (NEO) через Asteroids - NeoWs API
        try:
            neo_data = await self.nasa_client.fetch_neo_feed(days=days)
            if isinstance(neo_data, dict) and "error" not in neo_data:
                near_earth_objects = neo_data.get("near_earth_objects", {})
                for date_str, objects in near_earth_objects.items():
                    if isinstance(objects, list):
                        for neo in objects:
                            if isinstance(neo, dict):
                                # Название объекта
                                name = neo.get("name", "Неизвестный объект")
                                
                                # ID объекта (может быть в разных форматах)
                                neo_id = neo.get("id", neo.get("neo_reference_id", ""))
                                
                                # Данные о сближении
                                close_approach_data = neo.get("close_approach_data", [])
                                if close_approach_data and len(close_approach_data) > 0:
                                    approach = close_approach_data[0]
                                    
                                    # Время события - форматируем для отображения
                                    event_time = approach.get("close_approach_date_full", "")
                                    if not event_time:
                                        event_time = approach.get("close_approach_date", date_str)
                                    # Если есть полное время, форматируем его
                                    if event_time and "T" in event_time:
                                        try:
                                            dt = datetime.fromisoformat(event_time.replace("Z", "+00:00"))
                                            event_time = dt.strftime("%Y-%m-%d %H:%M:%S UTC")
                                        except:
                                            pass
                                    
                                    # Расстояние
                                    distance = approach.get("miss_distance", {})
                                    distance_km = "N/A"
                                    if isinstance(distance, dict):
                                        distance_km = distance.get("kilometers", "N/A")
                                        if isinstance(distance_km, (int, float)):
                                            distance_km = f"{distance_km:,.0f}"
                                    
                                    # Скорость
                                    velocity = approach.get("relative_velocity", {})
                                    velocity_kmh = "N/A"
                                    if isinstance(velocity, dict):
                                        velocity_kmh = velocity.get("kilometers_per_hour", "N/A")
                                        if isinstance(velocity_kmh, (int, float)):
                                            velocity_kmh = f"{velocity_kmh:,.0f}"
                                    
                                    # Орбитальное тело
                                    orbiting_body = approach.get("orbiting_body", "Земля")
                                    
                                    # Диаметр объекта (если доступен)
                                    estimated_diameter = neo.get("estimated_diameter", {})
                                    diameter_km = "N/A"
                                    if isinstance(estimated_diameter, dict):
                                        meters = estimated_diameter.get("meters", {})
                                        if isinstance(meters, dict):
                                            avg_diameter = meters.get("estimated_diameter_avg", None)
                                            if avg_diameter:
                                                diameter_km = f"{avg_diameter / 1000:.2f}"
                                    
                                    # Опасность
                                    is_potentially_hazardous = neo.get("is_potentially_hazardous_asteroid", False)
                                    hazard_status = "Потенциально опасен" if is_potentially_hazardous else "Безопасен"
                                    
                                    # Формируем событие
                                    events.append({
                                        "number": event_number,
                                        "name": name,
                                        "type": f"Сближение с {orbiting_body}",
                                        "when": event_time,
                                        "extra": f"Расстояние: {distance_km} км, "
                                                f"Скорость: {velocity_kmh} км/ч, "
                                                f"Диаметр: {diameter_km} км, "
                                                f"Статус: {hazard_status}",
                                        "source": "NASA NeoWs",
                                        "neo_id": str(neo_id),
                                        "distance_km": distance_km,
                                        "velocity_kmh": velocity_kmh,
                                        "diameter_km": diameter_km,
                                        "hazard_status": hazard_status,
                                        "orbiting_body": orbiting_body
                                    })
                                    event_number += 1
            elif isinstance(neo_data, dict) and "error" in neo_data:
                return {
                    "error": neo_data.get("error", "Unknown error"),
                    "code": neo_data.get("status_code", 500),
                    "filters": {
                        "days": days,
                        "limit": limit
                    },
                    "events": []
                }
        except Exception as e:
            return {
                "error": f"Error fetching NEO data: {str(e)}",
                "filters": {
                    "days": days,
                    "limit": limit
                },
                "events": []
            }
        
        # Сортируем события по времени
        events.sort(key=lambda x: x.get("when", ""))
        
        # Применяем лимит, если указан
        total_count = len(events)
        if limit and limit > 0:
            events = events[:limit]
        
        return {
            "filters": {
                "days": days,
                "limit": limit
            },
            "events": events,
            "source": "NASA Asteroids - NeoWs API",
            "count": len(events),
            "total_count": total_count
        }


from typing import Any, Optional
import json


def extract_number(value: Any) -> Optional[float]:
    """Извлечь число из значения (поддержка строк и чисел)"""
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value)
        except ValueError:
            return None
    return None


def extract_string(value: Any, keys: list[str]) -> Optional[str]:
    """Извлечь строку из JSON по ключам"""
    if not isinstance(value, dict):
        return None
    
    for key in keys:
        if key in value:
            val = value[key]
            if isinstance(val, str) and val:
                return val
            if isinstance(val, (int, float)):
                return str(val)
    return None


def extract_datetime(value: Any, keys: list[str]) -> Optional[str]:
    """Извлечь дату/время из JSON по ключам"""
    from datetime import datetime
    
    if not isinstance(value, dict):
        return None
    
    for key in keys:
        if key in value:
            val = value[key]
            if isinstance(val, str):
                # Попробуем распарсить различные форматы
                for fmt in [
                    "%Y-%m-%dT%H:%M:%S.%fZ",
                    "%Y-%m-%dT%H:%M:%SZ",
                    "%Y-%m-%d %H:%M:%S",
                    "%Y-%m-%d",
                ]:
                    try:
                        dt = datetime.strptime(val, fmt)
                        return dt.isoformat() + "Z"
                    except ValueError:
                        continue
            elif isinstance(val, (int, float)):
                # Unix timestamp
                try:
                    dt = datetime.fromtimestamp(val)
                    return dt.isoformat() + "Z"
                except (ValueError, OSError):
                    pass
    return None


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Вычислить расстояние между двумя точками в км (формула гаверсинуса)"""
    import math
    
    R = 6371.0  # Радиус Земли в км
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1_rad)
        * math.cos(lat2_rad)
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c


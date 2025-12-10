from typing import Any, Optional
import json
from datetime import datetime


class Validators:
    """
    Класс валидации данных для удобства проверки
    Содержит методы для валидации различных типов данных
    """
    
    @staticmethod
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
    
    @staticmethod
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
    
    @staticmethod
    def extract_datetime(value: Any, keys: list[str]) -> Optional[str]:
        """Извлечь дату/время из JSON по ключам"""
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
    
    @staticmethod
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
    
    @staticmethod
    def validate_limit(limit: int, min_value: int = 1, max_value: int = 1000) -> int:
        """Валидация лимита записей"""
        if limit < min_value:
            return min_value
        if limit > max_value:
            return max_value
        return limit
    
    @staticmethod
    def validate_search_query(search: Optional[str], max_length: int = 200) -> Optional[str]:
        """Валидация поискового запроса"""
        if not search:
            return None
        search = search.strip()
        if len(search) > max_length:
            return search[:max_length]
        return search if search else None
    
    @staticmethod
    def validate_days(days: int, min_days: int = 1, max_days: int = 7) -> int:
        """Валидация количества дней"""
        if days < min_days:
            return min_days
        if days > max_days:
            return max_days
        return days


# Обратная совместимость: функции для существующего кода
def extract_number(value: Any) -> Optional[float]:
    """Извлечь число из значения (поддержка строк и чисел)"""
    return Validators.extract_number(value)


def extract_string(value: Any, keys: list[str]) -> Optional[str]:
    """Извлечь строку из JSON по ключам"""
    return Validators.extract_string(value, keys)


def extract_datetime(value: Any, keys: list[str]) -> Optional[str]:
    """Извлечь дату/время из JSON по ключам"""
    return Validators.extract_datetime(value, keys)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Вычислить расстояние между двумя точками в км (формула гаверсинуса)"""
    return Validators.haversine_km(lat1, lon1, lat2, lon2)

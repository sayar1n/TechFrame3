"""
Утилиты для работы с JWST API

Аналог оригинального App\Support\JwstHelper из Laravel проекта.
Содержит функции для извлечения URL изображений из ответов JWST API.
"""
from typing import Any
import re


def pick_image_url(item: dict[str, Any]) -> str | None:
    """
    Извлечь URL изображения из элемента JWST - рекурсивный поиск
    
    Точная реализация оригинального JwstHelper::pickImageUrl() из PHP:
    - Использует стек для обхода всей структуры
    - Проверяет ВСЕ строки в структуре, независимо от ключа
    - Регулярное выражение: ~^https?://.*\.(?:jpg|jpeg|png)$~i
    
    Args:
        item: Словарь с данными от JWST API
        
    Returns:
        URL изображения или None, если не найдено
    """
    # Используем стек для рекурсивного обхода (как в оригинальном PHP коде)
    stack = [item]
    
    while stack:
        cur = stack.pop()
        
        # Проверяем все значения в текущем объекте
        for key, val in cur.items():
            # Если это строка - проверяем, является ли она URL изображения
            if isinstance(val, str) and val.strip():
                url = val.strip()
                # Регулярное выражение как в PHP: ~^https?://.*\.(?:jpg|jpeg|png)$~i
                if re.search(r'^https?://.*\.(jpg|jpeg|png)(\?.*)?$', url, re.IGNORECASE):
                    return url
            
            # Если это словарь или список - добавляем в стек для дальнейшего обхода
            if isinstance(val, dict):
                stack.append(val)
            elif isinstance(val, list):
                # Добавляем все элементы списка в стек
                for elem in val:
                    if isinstance(elem, dict):
                        stack.append(elem)
    
    return None


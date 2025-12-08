FROM redis:7-alpine

# Копируем конфигурацию Redis
COPY redis.conf /usr/local/etc/redis/redis.conf

# Запускаем Redis с конфигурацией
CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]


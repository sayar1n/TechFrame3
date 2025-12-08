#!/bin/sh
set -e

cd /opt/legacy

# Компиляция Pascal программы
echo "[pascal] compiling legacy.pas"
fpc -O2 -S2 legacy.pas -olegacy

# Ожидание готовности БД
until pg_isready -h "$PGHOST" -p "${PGPORT:-5432}" -U "$PGUSER" -d "$PGDATABASE"; do
  echo "Waiting for database..."
  sleep 2
done

# Запуск генерации CSV
while true; do
  echo "Generating CSV at $(date)"
  ./legacy || echo "Error running legacy, will retry..."
  sleep "${GEN_PERIOD_SEC:-300}"
done

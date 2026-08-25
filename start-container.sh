#!/bin/bash
set -e

cd /app

# region agent log
echo "DEBUG_PHP_VERSION=$(php -r 'echo PHP_VERSION;')"
echo "DEBUG_START_CMD=start-container.sh"
# endregion

mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache database

if [ "${DB_CONNECTION:-sqlite}" = "sqlite" ]; then
    DB_FILE="${DB_DATABASE:-database/database.sqlite}"
    if [ ! -f "$DB_FILE" ]; then
        mkdir -p "$(dirname "$DB_FILE")"
        touch "$DB_FILE"
    fi
fi

if [ "$RAILPACK_SKIP_MIGRATIONS" != "true" ]; then
    echo "Running migrations ..."
    php artisan migrate --force
fi

php artisan storage:link --force || true
php artisan package:discover --ansi || true
php artisan optimize:clear
php artisan optimize

echo "Starting queue worker ..."
php artisan queue:work --tries=1 --sleep=1 &

echo "Starting scheduler ..."
php artisan schedule:work &

# Railway HTTP proxy targets 8080. Do not use $PORT — a TCP proxy
# (Postgres) on this service sets PORT=5432 and would steal HTTP.
LISTEN_PORT=8080
echo "Starting FrankenPHP on :${LISTEN_PORT} (env PORT=${PORT:-unset}) ..."
exec frankenphp php-server --listen ":${LISTEN_PORT}" --root /app/public

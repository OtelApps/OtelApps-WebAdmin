#!/bin/bash
set -e

cd /app

echo "DEBUG_PHP_VERSION=$(php -r 'echo PHP_VERSION;')"
echo "DEBUG_START_CMD=start-container.sh"
echo "DEBUG_APP_KEY_SET=$([ -n "$APP_KEY" ] && echo yes || echo no)"

# AES-256-CBC needs 32 raw bytes. A non-empty APP_KEY can still be invalid
# (e.g. "base64:" with no payload → Encrypter('', 'AES-256-CBC') → HTTP 500).
php -r '
$key = getenv("APP_KEY");
if ($key === false || $key === "") {
    fwrite(STDERR, "FATAL: APP_KEY is not set. In Railway → Variables paste the full output of: php artisan key:generate --show\n");
    exit(1);
}
$raw = $key;
if (str_starts_with($key, "base64:")) {
    $payload = substr($key, 7);
    $decoded = base64_decode($payload, true);
    if ($payload === "" || $decoded === false) {
        fwrite(STDERR, "FATAL: APP_KEY starts with base64: but the rest is empty or not valid base64. Paste the FULL value including the base64: prefix, without quotes.\n");
        exit(1);
    }
    $raw = $decoded;
}
$len = strlen($raw);
if ($len !== 16 && $len !== 32) {
    fwrite(STDERR, "FATAL: APP_KEY decodes to {$len} bytes; AES-256-CBC needs 32. Generate a new one: php artisan key:generate --show\n");
    exit(1);
}
echo "APP_KEY_OK bytes={$len}\n";
'

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

echo "Starting queue worker ..."
php artisan queue:work --tries=1 --sleep=1 &

echo "Starting scheduler ..."
php artisan schedule:work &

# Railway HTTP proxy targets 8080. Do not use $PORT — a TCP proxy
# (Postgres) on this service sets PORT=5432 and would steal HTTP.
LISTEN_PORT=8080
echo "Starting FrankenPHP on :${LISTEN_PORT} (env PORT=${PORT:-unset}) ..."
exec frankenphp php-server --listen ":${LISTEN_PORT}" --root /app/public

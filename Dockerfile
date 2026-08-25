# syntax=docker/dockerfile:1

FROM dunglas/frankenphp:1-php8.4-trixie

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends git unzip ca-certificates curl \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN install-php-extensions pdo_pgsql pdo_sqlite zip intl opcache

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY . /app

RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts \
    && npm ci \
    && npm run build \
    && npm prune --omit=dev \
    && mkdir -p \
        storage/framework/cache \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache \
        database \
    && chmod -R a+rw storage bootstrap/cache \
    && chmod +x /app/start-container.sh

ENV IS_LARAVEL=true
ENV PORT=8080
ENV SERVER_NAME=:8080
ENV APP_ENV=production
ENV APP_DEBUG=false
ENV LOG_CHANNEL=stderr
ENV LOG_LEVEL=error

EXPOSE 8080

CMD ["/app/start-container.sh"]

# Деплой

## Что подготовлено

- `apps/web` собирается отдельно и размещается в GitHub Pages. Push в `main` запускает сборку и публикацию SPA.
- API собирается в Docker-образ `ghcr.io/<owner>/<repository>/api` и публикуется в GitHub Container Registry.
- На DigitalOcean Droplet API работает за Caddy; Caddy получает и обновляет HTTPS-сертификат для `API_DOMAIN`.
- PostgreSQL остаётся на существующем сервере. Droplet подключается к отдельной базе/пользователю; контейнер PostgreSQL здесь не создаётся.

## GitHub Pages

1. В настройках репозитория откройте **Settings → Pages** и выберите **GitHub Actions** в качестве источника.
2. Workflow `.github/workflows/deploy-web.yml` публикует фронтенд после каждого push в `main` и по ручному запуску.
3. В **Settings → Secrets and variables → Actions → Variables** задайте:
   - `VITE_API_BASE_URL` — например `https://api.example.com/api/v1`.
   - `VITE_GOOGLE_MAPS_API_KEY` — ключ Maps JavaScript API с ограничением по сайтам и разрешённым API.
   - `VITE_BASE_PATH` — необязательно. Для проектного адреса workflow сам использует `/<имя-репозитория>/`; для собственного домена задайте `/`.

Значения Vite встраиваются в публичные файлы сайта. Ключ Google Maps не является секретом после сборки, поэтому ограничьте его по HTTP referrer и API.

## DigitalOcean Droplet и API

Нужен Linux Droplet с Docker Engine и Docker Compose plugin. DNS-запись `A` для `API_DOMAIN` должна указывать на IP Droplet. В firewall разрешите входящие SSH, HTTP и HTTPS порты. На сервере также должен быть разрешён исходящий доступ к существующему PostgreSQL серверу; при сетевом allowlist добавьте IP Droplet.

1. На сервере создайте `/etc/bike-sharing/api.env` с правами `600` и заполните:

   ```dotenv
   PORT=3001
   API_DOMAIN=api.example.com
   WEB_ORIGIN=https://<owner>.github.io
   DATABASE_URL=postgresql://<user>:<password>@<postgres-host>:5432/<dedicated-database>?schema=public&sslmode=require
   TELEGRAM_BOT_TOKEN=
   ```

   Если опубликован фронтенд на собственном домене, добавьте его origin в `WEB_ORIGIN`. Несколько origin можно перечислить через запятую. Пароль с символами URL нужно percent-encode. Используйте отдельные DB и пользователя с минимальными правами и сначала сделайте резервную копию.

2. На Droplet выполните вход в GHCR от пользователя, от имени которого запускается Docker Compose. Используйте GitHub username и токен с правом `read:packages`:

   ```sh
   docker login ghcr.io
   ```

3. Добавьте в GitHub Actions **Secrets**:
   - `DO_HOST` — адрес Droplet.
   - `DO_USER` — SSH-пользователь.
   - `DO_SSH_PRIVATE_KEY` — приватный SSH-ключ для Actions.
   - `DO_KNOWN_HOSTS` — заранее проверенная SSH host key строка Droplet.

   Добавьте в **Variables**:
   - `DO_SSH_PORT` — порт SSH; по умолчанию `22`.
   - `DO_API_DEPLOY_ENABLED` — `true` после подготовки Droplet, DNS, `/etc/bike-sharing/api.env` и входа GHCR.

После push в `main` workflow соберёт API image. Когда `DO_API_DEPLOY_ENABLED=true`, он скопирует Compose/Caddy конфигурацию, применит миграции и обновит контейнеры. Отключите автоматический deploy переменной `false`, если нужно остановить раскатку, при этом сборка и публикация образа продолжатся.

## Prisma и схема

`apps/api/.env.example` предназначен для локальной разработки. Для создания миграции в безопасной dev-базе используйте `pnpm --filter @bike-sharing/api db:migrate:dev`; в production workflow запускает `db:migrate:deploy`. Не направляйте команду `migrate dev` на рабочую базу. Не добавляйте production URL в GitHub Variables или в репозиторий: DATABASE_URL передаётся только через файл окружения на сервере.

Начальные модели включают `Scooter`, `Ride`, `ParkingZone`, `ContentPage`, `HomePageSettings`, `Listing`, `Subscription` и `TopPlacement`. API-обработчики, права администраторов и телеметрия пока не готовы. Применение запретной зоны к завершению поездки должно быть реализовано сервером после появления API и протокола связи со скутером.

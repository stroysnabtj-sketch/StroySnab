# Запуск StroySnab в Railway

Рабочий сервис `StroySnab` находится в проекте `gregarious-vision`, окружение `production`. Репозиторий — `stroysnabtj-sketch/StroySnab`, ветка `main`. Сервис `Postgres` уже запущен в этом же окружении.

## Зависимости

| Что | Для чего |
| --- | --- |
| Node.js 20.20 и npm 10.8.2 | Проверенные версии для установки и сборки с текущим Dockerfile |
| Git | Публикация исправления в GitHub |
| Railway CLI | Запуск из терминала, если он нужен. Для деплоя из GitHub достаточно панели Railway |
| PostgreSQL 15+ | Хранение каталога, заказов, аккаунтов и сессий. Миграции используют `pg_trgm`, `btree_gist` и `citext` |
| Приватный S3-совместимый бакет | Постоянное хранение загруженных изображений и вложений |
| HTTPS-шлюз почты или SMS | Отправка кодов входа и регистрации |

Пакеты Next.js, React, Drizzle, Sharp, PDFKit и остальные ставятся командой `npm ci`. Прямые зависимости перечислены в [package.json](../package.json), точные версии всех пакетов закреплены в [package-lock.json](../package-lock.json). На Railway Node.js и зависимости ставит [Dockerfile](../Dockerfile). Сборка запускает `npm run build:noenv`, приложение — `node server.js`.

## Публикация исправления

Последняя проверенная неудачная сборка использовала коммит `9a7a42d` и остановилась на `npm ci` с `Missing: esbuild@0.28.2 from lock file`. Исправленный lock-файл уже в рабочей папке. Чтобы Railway получил его из GitHub, выполните в PowerShell:

```powershell
Set-Location -LiteralPath 'C:\Users\alijo\Documents\app'
git status --short --branch
git add -- package-lock.json .env.example docs/RAILWAY_DEPLOYMENT.md
git commit --only -m "Fix Railway dependency installation" -- package-lock.json .env.example docs/RAILWAY_DEPLOYMENT.md
git push origin main
```

После отправки проверьте вкладку **Deployments** сервиса `StroySnab`. Если сборка не началась автоматически, запустите **Deploy Latest Commit**. Убедитесь, что Railway показывает новый хеш коммита. **Redeploy** на записи `9a7a42d` повторит сборку старого кода.

Если удобнее запустить сборку прямо из рабочей папки, выполните из того же каталога:

```powershell
npx.cmd --yes --package=@railway/cli railway up --project fb05d3dc-c445-480b-bbd2-8e864f914843 --environment production --service StroySnab
```

Этот вариант загружает локальные файлы в Railway. Для следующих деплоев из GitHub всё равно нужно опубликовать исправленный lock-файл.

## Переменные сервиса StroySnab

В **Variables** проверьте значения ниже. При проверке проекта `DATABASE_URL` уже был задан и указывал на внутренний адрес Railway. `APP_URL` совпадал с текущим доменом. Явного `PORT` не было, а домен направлял трафик на `8080`.

```dotenv
DATABASE_URL=${{Postgres.DATABASE_URL}}
APP_URL=https://stroysnab-production-d28d.up.railway.app
PORT=8080
```

`PORT` должен совпадать с **Settings → Networking → Target Port**. `NODE_ENV=production` и `HOSTNAME=0.0.0.0` уже задаёт Dockerfile. При подключении `stroysnab.tj` через **Networking → Custom Domain** обновите `APP_URL` на основной HTTPS-адрес. `SESSION_SECRET` уже задан в Railway. Текущая версия приложения хранит хеши случайных токенов сессий в PostgreSQL и эту переменную не читает.

Миграции применяются при первом обращении к БД. После успешного запуска откройте [/api/health](https://stroysnab-production-d28d.up.railway.app/api/health), затем [главную](https://stroysnab-production-d28d.up.railway.app/) и [каталог](https://stroysnab-production-d28d.up.railway.app/catalog). `/api/health` проверяет HTTP-процесс, а главная и каталог обращаются к БД. На новой базе отдельно понадобится рабочий каталог и первый супер-админ. `npm run db:seed` создаёт демонстрационные товары и аккаунты с известными паролями. Используйте его только для локальной или отдельной тестовой базы.

## Хранение фотографий и заявок

У работающего medtech.tj фотографии каталога загружаются с Cloudinary. Его Python-бэкенд принимает `CLOUDINARY_URL` или три отдельных значения `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Для StroySnab уже реализован другой интерфейс — S3. Поэтому для запуска загрузок подходит приватный бакет Backblaze B2 или Cloudflare R2. Достаточно ключа с доступом к объектам этого бакета.

```dotenv
STORAGE_DRIVER=s3
S3_BUCKET=имя-приватного-бакета
S3_REGION=регион-из-панели-провайдера
S3_ENDPOINT=https://s3-адрес-из-панели-провайдера
S3_FORCE_PATH_STYLE=true
S3_ACCESS_KEY_ID=идентификатор-ключа
S3_SECRET_ACCESS_KEY=секрет-ключа
```

Для R2 регион — `auto`, а endpoint берётся со страницы R2. Для B2 скопируйте регион и S3 endpoint бакета из панели Backblaze. Пока бакет не подключён, `STORAGE_DRIVER=local` позволяет проверить интерфейс, но файлы в контейнере без Volume пропадут при замене контейнера. Если уже есть локальные файлы, перенесите их в бакет с исходными ключами перед сменой драйвера.

## Вход и дополнительные подключения

| Функция | Что настроить |
| --- | --- |
| Код на почту | `AUTH_EMAIL_SEND_URL`, `AUTH_EMAIL_SEND_TOKEN` |
| Код по SMS | `AUTH_SMS_SEND_URL`, `AUTH_SMS_SEND_TOKEN` |
| SMS о заказах | `NOTIFICATIONS_SMS_ENABLED=true`, `NOTIFICATIONS_SMS_SEND_URL`, `NOTIFICATIONS_SMS_SEND_TOKEN`, `NOTIFICATIONS_SMS_SENDER`. Для подтверждений доставки — `NOTIFICATIONS_SMS_CALLBACK_SECRET`. Для отправки потребуется отдельный запуск worker по расписанию |
| Другой сервер тайлов карты | `NEXT_PUBLIC_MAP_TILE_URL` на этапе сборки. По умолчанию используются тайлы OpenStreetMap |

Шлюзы входа принимают HTTPS POST с Bearer-токеном и JSON `{template, recipient, code, expiresInSeconds}`. Ожидаемый ответ — `{"accepted":true}`. Адрес SMTP или ключ произвольного API сам по себе не подойдёт, если сервис не поддерживает этот контракт. Без шлюза соответствующий канал входа и регистрации недоступен. После подключения шлюза на чистой базе первый администратор регистрируется с реальным контактом, а владелец базы назначает ему роль `SUPER_ADMIN`. Остальных сотрудников добавляют через админку.

Формат SMS заказов и подписи описан в [notification-outbox.md](notification-outbox.md). Внешний ИИ для разбора заявок и API банка пока не подключены. Эти интеграции не требуются для запуска сайта.

## Локальный запуск в отдельной базе

```powershell
Set-Location -LiteralPath 'C:\Users\alijo\Documents\app'
npm.cmd ci
$env:PGLITE_DATA_DIR = Join-Path $PWD '.data/railway-preview'
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
npm.cmd run db:seed
npm.cmd run dev
```

Откройте [localhost:3000](http://localhost:3000). Для повторной проверки production-сборки выполните `npm.cmd run build:noenv`. Локальный запуск с PGlite использует отдельную файловую базу. Если настроен `.env.local`, убедитесь, что в нём нет `DATABASE_URL` от Railway перед использованием демонстрационных данных.

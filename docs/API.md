# API

API использует единый формат ошибок: `{ "error": { "code", "message", "fields?" } }`. Денежные `bigint` передаются строками. Эндпоинты появляются в этом документе вместе с соответствующими этапами.

## Аутентификация и пользователи

- `POST /api/auth/register` — публичная регистрация; тело `fullName`, `phone`, `email?`, `password`, `termsAccepted: true`, `refCode?`; 201 + HttpOnly session cookie; 400/429.
- `POST /api/auth/login` — телефон или e-mail и пароль; 200 + cookie; 401/429.
- `POST /api/auth/logout` — завершение текущей сессии; 200.
- `POST /api/auth/forgot`, `POST /api/auth/reset` — одноразовый токен восстановления сроком 1 час.
- `GET /api/auth/sessions`, `DELETE /api/auth/sessions/:id` — только свои сессии.
- `PATCH /api/account/profile` — имя и телефон текущего покупателя.
- `GET/POST /api/admin/users`, `PATCH /api/admin/users/:id` — право `users:manage`; административные роли назначает только `admins:manage`.

## Каталог и корзина (этап 2)

- `GET /api/public/catalog/suggestions?q=…` — до 7 подсказок; используются FTS и `pg_trgm`.
- `POST /api/public/cart/items` — добавление предложения гостем или покупателем; `offerId`, `qty`; гостю выдаётся HttpOnly-cookie `kh_cart`.
- `PATCH/DELETE /api/public/cart/items/:id` — изменение/удаление только позиции собственной корзины.
- `GET/POST /api/admin/catalog/products`, `GET/PATCH/DELETE /api/admin/catalog/products/:id` — право `catalog:manage`; DELETE архивирует товар.
- `POST /api/admin/catalog/products/:id/images` — JPEG/PNG/WebP до 5 МБ, преобразование в WebP с ресайзом; до 10 фото.
- `GET /api/files/:id` — чтение только файла, связанного с изображением товара.
- `GET/POST /api/admin/catalog/categories`, `PATCH /api/admin/catalog/categories/:id` — дерево категорий.
- `GET /api/admin/catalog/products/export?format=csv|xlsx&template=1` — выгрузка или шаблон.
- `POST /api/admin/catalog/products/import?dryRun=0|1` — построчная проверка и импорт CSV/XLSX.
- `POST /api/product-requests` — публичная заявка на отсутствующий товар; нормализация телефона, honeypot, идемпотентность 30 секунд, лимит 10/час с IP.

Публичные ответы товаров и корзины содержат только итоговую цену покупателя. Поля `supplierPriceDirams`, правила наценки и маржа не сериализуются.

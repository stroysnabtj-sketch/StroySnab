# Kushoniyon · STROYHUB.TJ

Маркетплейс строительных материалов: витрина, кабинет покупателя, кабинет поставщика и административная платформа.

## Запуск

```bash
npm install
npm run db:seed
npm run dev
```

Откройте `http://localhost:3000`. Без `DATABASE_URL` используется встроенный PostgreSQL (PGlite) в `.data/kushoniyon`; данные сохраняются между перезапусками на том же сервере. Для production задайте PostgreSQL 15+ в `DATABASE_URL` и обязательный `APP_URL`.

```bash
npm run check
npm run build:noenv
docker-compose up --build
```

## Структура

- `src/app` — страницы и REST Route Handlers.
- `src/modules` — бизнес-логика по доменам.
- `src/db/schema` — Drizzle-схемы; `drizzle` — миграции.
- `src/components` — собственная UI-библиотека.
- `src/i18n` — русский словарь и таджикский откат.
- `tests` — Vitest и Playwright.
- `docs` — архитектура, API и открытые решения.

Каталог содержит 240 seed-товаров, 24 категории и 432 предложения. Работают поиск с опечатками, фильтры, SEO, галерея, CSV/XLSX импорт/экспорт, гостевая корзина и публичная заявка на отсутствующий товар.

Номера документов выдаются атомарно в транзакции; при откате возможен пропуск номера. Деньги хранятся только в целых дирамах.

## Демонстрационные аккаунты

После `npm run db:seed`:

- Суперадминистратор: `admin@stroyhub.tj` / `Admin123!`
- Менеджер продаж: `sales@stroyhub.tj` / `Sales123!`
- Контент-менеджер: `content@stroyhub.tj` / `Content123!`
- Логист: `logistics@stroyhub.tj` / `Logistics123!`
- Покупатель: `client@example.com` / `Client123!`
- Поставщик (владелец): `seller@stroyhub.tj` / `Seller123!`
- Сотрудники поставщиков: `seller2@stroyhub.tj`, `seller3@stroyhub.tj` / `Seller123!`

Эти пароли предназначены только для локальной разработки и должны быть заменены перед production-эксплуатацией.

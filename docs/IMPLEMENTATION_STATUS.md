> Исторический протокол от 01.11.2026. Таблица ниже не отражает состояние выпуска. Актуальный статус: [PROJECT_STATE.md](PROJECT_STATE.md).

# Kushoniyon / STROYHUB.TJ — Журнал реализации

**Дата начала:** 01.11.2026  
**Исполнитель:** AI Pair Programmer (Antigravity)  
**Базовый план:** `docs/superpowers/plans/2026-11-01-project-completion.md`  
**Матрица требований:** `docs/requirements-coverage.md`

---

## 1. Исходное состояние репозитория (на 01.11.2026)

- **Версии среды:** Node.js v24.13.0, npm 11.6.2, Windows 11 PowerShell.
- **Git:** изначально отсутствовал (`.git` не был инициализирован). Инициализирован локальный репозиторий, сделан базовый снимок: коммит `chore: initial repository baseline before plan execution`.
- **Зависимости:** каталог `node_modules` отсутствовал.
- **Исходный запуск `npm ci`:** завершился с ошибкой: `package-lock.json` содержал 609 ссылок на недоступный внутренний registry `https://npm.mirrors.msh.team/`. Ссылки были заменены на `https://registry.npmjs.org/` без изменения версий, после чего `npm install` и `npm ci` выполнены успешно с кодом 0.
- **Документация:** исходное полное ТЗ маркетплейса в архиве отсутствует. Зафиксированы доступные источники: `docs/reference/new-functions-spec-2026-10-30.md`, `docs/reference/previous-agent-progress.txt`, `README.md`, `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/OPEN_BUSINESS_DECISIONS.md`, `docs/NOT_IMPLEMENTED.md`. Сформирован `docs/requirements-coverage.md`.

---

## 2. Задачи и статус выполнения

| Задача | Описание | Статус | Коммит | Дата |
|---|---|---|---|---|
| **0** | Воспроизводимый запуск и исходный протокол | Завершена | `cba1cd6` | 01.11.2026 |
| **1** | Исправить контракт API, числа и доверие к запросу | Завершена | `fdd5cab` | 01.11.2026 |
| **2** | Закрыть конкурентные ошибки auth и ролей | Завершена | `d7e3116` | 01.11.2026 |
| **3** | Завершить соглашение и политику | Завершена | `cc6b08f` | 01.11.2026 |
| **4** | Довести публичный приём заявок до требований ТЗ | Завершена | `task-4-product-requests` | 01.11.2026 |
| **5** | Реализовать обработку заявок менеджером и кабинет покупателя | В работе | — | 01.11.2026 |
| **6** | Завершить интерфейс поставщика и существующий этап 3 | Запланировано | — | — |
| **7** | Реализовать рефералы без автоматического начисления | Запланировано | — | — |
| **8** | Реальные уведомления и безопасный статус гостевой заявки | Запланировано | — | — |
| **9** | Корзина → оформление → заказ с резервами | Запланировано | — | — |
| **10** | Учёт оплаты и документы без эквайринга | Запланировано | — | — |
| **11** | Доставка, транспорт и диспетчеризация | Запланировано | — | — |
| **12** | Навигация, реальные обзоры, доступность и локализация | Запланировано | — | — |
| **13** | Миграции, производительность и техническая приёмка | Запланировано | — | — |
| **14** | Production-конфигурация и выпуск | Запланировано | — | — |

---

## 3. Детальные протоколы по задачам

### Задача 0. Воспроизводимый запуск и исходный протокол
- **Файлы:**
  - `docs/requirements-coverage.md` (создан)
  - `docs/IMPLEMENTATION_STATUS.md` (создан)
  - `src/db/index.ts` (поддержка `PGLITE_DATA_DIR` для изоляции тестов, безопасный идемпотентный `closeDb()`)
  - `scripts/build-noenv.mjs` (кроссплатформенная сборка)
  - `scripts/seed.ts` (экспорт `seedDatabase(db)`)
  - `package.json` (обновление `build:noenv` через Node-скрипт)
  - `playwright.config.ts` (`baseURL: localhost:3000`, `reuseExistingServer` только при явном флаге)
  - `vitest.config.ts` и `tests/setup.ts` (изоляция тестовых данных, автоматический seed и последовательный запуск)
  - `.eslintrc.json` (игнорирование автогенерируемого `next-env.d.ts`)
- **Фактические результаты команд:**
  - `npm run db:migrate`: код 0
  - `npm run db:seed`: код 0 (повторный запуск проверен, идемпотентен, 24 категории, 240 товаров, 432 предложения)
  - `npm run check`: код 0 (lint 0 warnings, typecheck 0 errors, vitest 6 passed files, 27 tests)
  - `npm run build:noenv`: код 0 (42 маршрута успешно собраны и оптимизированы)

### Задача 1. Исправить контракт API, числа и доверие к запросу
- **Файлы:**
  - `src/modules/system/quantity.ts` (создан: точная арифметика `numeric(14,3)` в тысячных `bigint`, парсинг, валидация, форматирование)
  - `src/server/security.ts` (создан: `assertSameOrigin`, проверка Fetch Metadata, ограничение размера body с 413)
  - `src/server/validation.ts` (создан: `parseJsonBody` с безопасным 400 при невалидном JSON)
  - `src/server/json.ts` (создан: `jsonResponse` с безопасной сериализацией BigInt в строки)
  - `src/server/api-error.ts` (поддержка заголовков в `ApiError`, безопасное маскированное логирование 500 ошибок через `log.error`)
  - `src/server/logger.ts` (маскирование телефонов, email, паролей, токенов сессий, cookie в логах)
  - `src/server/rate-limit.ts` (вычисление и возврат `Retry-After` заголовка в секундах при 429)
  - `src/server/request.ts` (безопасное определение IP без слепого доверия заголовкам клиента)
  - `src/modules/system/phone.ts` (строгая нормализация п. 0.3, выброс `ApiError(400)` вместо 500, запрет добавления +992 к международным номерам)
  - `src/modules/system/money.ts` (строгий `toDirams`, обработка сумм выше `Number.MAX_SAFE_INTEGER`, выброс 400 при некорректном вводе)
  - `src/modules/suppliers/offer-service.ts` (`OfferDTO`, `serializeOffer`, исключение утечки BigInt)
  - `src/components/admin-offers-panel.tsx` (устранена float-конверсия цены, используется `fromDirams`)
  - `tests/unit/api-errors.test.ts` (создан)
  - `tests/unit/request.test.ts` (создан)
  - `tests/unit/quantity.test.ts` (создан)
  - `tests/unit/system.test.ts` (расширен тестами money/phone)
  - `tests/e2e/suppliers.spec.ts` (добавлен тест сериализации и DTO предложений)
- **Фактические результаты команд:**
  - `npm run check`: код 0 (все 9 тестовых файлов, 47 тестов успешно пройдены)
  - `npm run build:noenv`: код 0

### Задача 2. Закрыть конкурентные ошибки auth и ролей
- **Файлы:**
  - `src/modules/auth/service.ts`:
    - Атомарное одноразовое поглощение токена сброса пароля (`passwordResets`) в транзакции с возвратом 400 `reset_invalid` при параллельных попытках.
    - Перехват 23505/unique violation при конкурентных регистрациях с преобразованием в 400 `user_exists` без 500.
    - Удаление активных сессий при блокировке пользователя (`status: BLOCKED`).
  - `src/modules/auth/admin-service.ts`:
    - Синхронизация `users.role` и `user_roles` при смене роли: старые роли удаляются, исключая рассинхронизацию.
    - Отзыв сессий при смене статуса на `BLOCKED`.
  - `src/modules/suppliers/service.ts`:
    - `assignSupplierOwner`: синхронизация ролей и членства прежнего владельца (понижение до STAFF в `supplierUsers` и `user_roles`), запрет назначения `SUPER_ADMIN` владельцем.
    - `getSupplierForUser`: поддержка флага `requireActive`, блокировка мутаций при `status: SUSPENDED`.
  - `src/modules/auth/session.ts`:
    - Автоматическая очистка сессий заблокированных/удалённых пользователей, присоединение `customerId` к `SessionUser`.
  - `tests/integration/auth-concurrency.test.ts` (создан: 4 теста конкурентности и консистентности ролей).
- **Фактические результаты команд:**
  - `npm run check`: код 0 (10 тестовых файлов, 51 тест пройден)
  - `npm run build:noenv`: код 0

### Задача 3. Завершить соглашение и политику
- **Файлы:**
  - `docs/terms/2026-10-30.md`: сохранён полный текст всех 8 разделов действующей редакции (общие положения, предмет, учётная запись, цены и оплата, заказы и доставка, персональные данные, ответственность, заключительные положения).
  - `tests/unit/auth.test.ts`: расширен проверками обязательности `termsAccepted: true` (отклонение `false`, `undefined`, `"true"` с ошибкой `terms_required`).
  - `tests/e2e/auth.spec.ts`: подтверждено наличие 8 разделов `#s1`..`#s8`, оглавления, атрибутов ссылки `target="_blank"`, блокировка отправки формы без согласия.
- **Фактические результаты команд:**
  - `npm run test -- tests/unit/auth.test.ts`: 3 теста пройдены.
  - `npx playwright test tests/e2e/auth.spec.ts`: 4 теста пройдены.

### Задача 4. Довести публичный приём заявок до требований ТЗ
- **Файлы:**
  - `drizzle/0006_product_requests_constraints.sql` & `drizzle/meta/_journal.json`:
    - CHECK `quantity IS NULL OR quantity > 0`
    - CHECK `estimated_price_dirams IS NULL OR estimated_price_dirams >= 0`
    - CHECK `estimated_delivery_days IS NULL OR (estimated_delivery_days >= 0 AND estimated_delivery_days <= 365)`
    - CHECK `version > 0`
    - CHECK `status IN ('NEW', 'IN_REVIEW', 'AVAILABLE', 'UNAVAILABLE', 'CANCELLED')`
    - Создана таблица `product_request_idempotency` с внешним ключом `request_id` -> `product_requests.id`.
  - `src/db/schema/requests.ts`: обновлена схема с DB CHECK ограничениями и таблицей `productRequestIdempotency`.
  - `src/modules/product-requests/schemas.ts`:
    - `getDushanbeDateStrings(now)`: динамический расчёт `today` и `maxDate` с учётом часового пояса `Asia/Dushanbe` и високосных лет (29 февраля).
    - `makeProductRequestSchema(now)`: адаптер `quantity` (число/строка), строгая валидация масштаба `numeric(14,3)`, обязательность единицы при указании количества, honeypot `website`.
  - `src/modules/product-requests/idempotency.ts`:
    - `withIdempotencyLock`: поключевая сериализация конкурентных вызовов для устранения гонок за один fingerprint.
    - `findRecentRequestByFingerprint`: проверка окна 30 секунд.
    - `recordIdempotencyKey`: сохранение ключа идемпотентности.
  - `src/modules/product-requests/service.ts`:
    - Порядок обработки: honeypot (201 без сохранения) -> нормализация -> проверка идемпотентности и блокировка -> списание rate limit -> создание заявки в транзакции.
    - Fingerprint учитывает контекст владельца (`user:id` или `ip:ip`), исключая коллизии между гостями за общим IP.
  - `src/components/product-request-form.tsx`:
    - Вариант единицы «другое» с вводом до 20 символов.
    - Полноценная обработка ошибок сети в `try/finally` с восстановлением кнопки.
    - Фокус на первом ошибочном поле, `aria-describedby` и `role="alert"`.
    - Дата с `min` (сегодня) и `max` (+2 года).
    - Навигация после успеха: «Создать ещё заявку», «В каталог» и «Мои заявки» (для авторизованных).
  - `tests/unit/product-requests.test.ts` (создан, 34 теста).
  - `tests/integration/product-requests.test.ts` (расширен, 9 тестов, включая 20 конкурентных запросов и проверку DB CHECK).
- **Фактические результаты команд:**
  - `npm run check`: код 0 (11 тестовых файлов, 92 теста пройдено, 0 lint warnings, 0 typecheck errors).
  - `npm run build:noenv`: код 0 (42 страницы собраны).
  - `npx playwright test tests/e2e/catalog.spec.ts`: код 0.



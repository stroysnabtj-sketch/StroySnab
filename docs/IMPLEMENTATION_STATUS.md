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
| **1** | Исправить контракт API, числа и доверие к запросу | Завершена | `task-1-api-contracts` | 01.11.2026 |
| **2** | Закрыть конкурентные ошибки auth и ролей | В работе | — | 01.11.2026 |
| **3** | Завершить соглашение и политику | Запланировано | — | — |
| **4** | Довести публичный приём заявок до требований ТЗ | Запланировано | — | — |
| **5** | Реализовать обработку заявок менеджером и кабинет покупателя | Запланировано | — | — |
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

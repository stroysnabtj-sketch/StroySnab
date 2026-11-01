# Kushoniyon / STROYHUB.TJ — Матрица покрытия требований

**Дата формирования:** 01.11.2026  
**Источники:** `docs/reference/new-functions-spec-2026-10-30.md`, `docs/superpowers/plans/2026-11-01-project-completion.md`  
**Статус:** Базовая фиксация требований для сквозного контроля задач 0–14.

---

## 1. Пользовательское соглашение (TRM, AC-TRM)

| ID | Требование | Задача реализации | Запланированные тесты / артефакты | Статус |
|---|---|---|---|---|
| TRM-01 | Заголовок, дата редакции, 8 разделов | Задача 3 | `tests/e2e/auth.spec.ts`, `/terms` | В процессе |
| TRM-02 | Тексты из `src/i18n/ru.ts` (`terms.s1.*`–`terms.s8.*`) | Задача 3 | `tests/unit/auth.test.ts` | В процессе |
| TRM-03 | Якоря `#s1`–`#s8`, оглавление вверху страницы | Задача 3 | `tests/e2e/auth.spec.ts` | В процессе |
| TRM-04 | Индексация без `noindex`, `<title>` «Пользовательское соглашение — STROYHUB.TJ» | Задача 3 | `tests/e2e/auth.spec.ts` | В процессе |
| TRM-05 | Адаптивность 360 px и стили для печати | Задача 3 | `tests/e2e/auth.spec.ts`, ручной print preview | В процессе |
| TRM-06 | HTTP 200 без обращения к БД | Задача 3 | `tests/e2e/auth.spec.ts`, audit / DB check | В процессе |
| TRM-10 | Чекбокс в регистрации, ссылка на `/terms` | Задача 3 | `tests/e2e/auth.spec.ts` | В процессе |
| TRM-11 | Ссылка открывается в новой вкладке `target="_blank"` | Задача 3 | `tests/e2e/auth.spec.ts` | В процессе |
| TRM-12 | Ссылка имеет `rel="noopener noreferrer"` | Задача 3 | `tests/e2e/auth.spec.ts` | В процессе |
| TRM-13 | Чекбокс по умолчанию не отмечен | Задача 3 | `tests/e2e/auth.spec.ts` | В процессе |
| TRM-14 | Клик по метке переключает чекбокс; Tab, Space; aria-describedby | Задача 3 | `tests/e2e/auth.spec.ts`, `tests/e2e/accessibility.spec.ts` | В процессе |
| TRM-15 | Ошибка под чекбоксом из i18n («Необходимо принять условия соглашения») | Задача 3 | `tests/e2e/auth.spec.ts` | В процессе |
| TRM-16 | При других ошибках формы состояние чекбокса сохраняется | Задача 3 | `tests/e2e/auth.spec.ts` | В процессе |
| TRM-17 | Кнопка «Зарегистрироваться» не заблокирована по чекбоксу | Задача 3 | `tests/e2e/auth.spec.ts` | В процессе |
| TRM-20 | В `users.terms_accepted_at` пишется текущее серверное время | Задача 3 | `tests/integration/auth.test.ts` | В процессе |
| TRM-21 | Время берётся исключительно на сервере | Задача 3 | `tests/integration/auth.test.ts` | В процессе |
| TRM-22 | Запись времени соглашения и создание пользователя в одной транзакции | Задача 3 | `tests/integration/auth.test.ts` | В процессе |
| TRM-23 | Событие аудита `user.terms_accepted` с версией и IP | Задача 3 | `tests/integration/auth.test.ts` | В процессе |
| TRM-24 | Создание пользователя сотрудником из админки не ставит ложный `terms_accepted_at` | Задача 3 | `tests/integration/auth.test.ts` | В процессе |
| TRM-30 | Ссылка в `site-footer.tsx` → `/terms` | Задача 3 | `tests/e2e/auth.spec.ts` | В процессе |
| TRM-31 | Подвал доступен на всех публичных страницах | Задача 3 | `tests/e2e/navigation.spec.ts` | В процессе |
| AC-TRM-1 | `GET /terms` отдаёт 200 для гостя, видны 8 разделов с якорями | Задача 3 | `tests/e2e/auth.spec.ts` | В процессе |
| AC-TRM-2 | Регистрация без галочки: HTTP 400, запись в `users` не создана | Задача 3 | `tests/unit/auth.test.ts`, `tests/e2e/auth.spec.ts` | В процессе |
| AC-TRM-3 | Регистрация с галочкой: `terms_accepted_at` в пределах 5 сек от текущего времени | Задача 3 | `tests/integration/auth.test.ts` | В процессе |
| AC-TRM-4 | Прямой POST в API без поля `termsAccepted` → 400 | Задача 3 | `tests/unit/auth.test.ts`, `tests/integration/auth.test.ts` | В процессе |
| AC-TRM-5 | Ссылка в форме открывается в новой вкладке | Задача 3 | `tests/e2e/auth.spec.ts` | В процессе |
| AC-TRM-6 | Ссылка в подвале присутствует на главной, в каталоге и на `/catalog/request` | Задача 3 | `tests/e2e/auth.spec.ts` | В процессе |
| AC-TRM-7 | Чекбокс управляется с клавиатуры, ошибка озвучивается скринридером | Задача 3 | `tests/e2e/accessibility.spec.ts` | В процессе |
| AC-TRM-8 | Повторный запуск мигратора не падает | Задачи 0, 3, 13 | `npm run db:migrate` test | В процессе |

---

## 2. Заявки на отсутствующие товары (PRQ, AC-PRQ)

| ID | Требование | Задача реализации | Запланированные тесты / артефакты | Статус |
|---|---|---|---|---|
| PRQ-01 | Форма доступна гостю и авторизованному покупателю | Задача 4 | `tests/e2e/catalog.spec.ts` | В процессе |
| PRQ-02 | Обязательные поля помечены *, `required` + `aria-required` | Задача 4 | `tests/e2e/catalog.spec.ts` | В процессе |
| PRQ-03 | Валидация zod на сервере дублирует клиентскую | Задача 4 | `tests/unit/product-requests.test.ts` | В процессе |
| PRQ-04 | Кнопка отправки блокируется, индикатор загрузки | Задача 4 | `tests/e2e/catalog.spec.ts` | В процессе |
| PRQ-05 | Пустые необязательные поля сохраняются как `NULL` | Задача 4 | `tests/integration/product-requests.test.ts` | В процессе |
| PRQ-06 | Скрытое поле honeypot: возвращает 201, ничего не сохраняет в БД | Задача 4 | `tests/integration/product-requests.test.ts` | В процессе |
| PRQ-07 | Экран успеха: номер заявки, ссылки «В каталог», «Создать ещё», «Мои заявки» | Задача 4 | `tests/e2e/catalog.spec.ts` | В процессе |
| PRQ-08 | Идемпотентность 30 секунд от того же IP возвращает тот же ID | Задача 4 | `tests/integration/product-requests.test.ts` | В процессе |
| PRQ-09 | Персональные данные передаются только в теле POST, не в URL | Задача 4 | `tests/unit/product-requests.test.ts` | В процессе |
| PRQ-10 | Номер присваивается в транзакции создания (`nextDocNumber`) | Задача 4 | `tests/integration/product-requests.test.ts` | В процессе |
| PRQ-11 | Номер уникален (`PRQ-XXXX`) | Задача 4 | `tests/integration/product-requests.test.ts` | В процессе |
| PRQ-12 | Номер расширяется после 9999 (`PRQ-10000`) | Задача 4 | `tests/unit/product-requests.test.ts` | В процессе |
| PRQ-13 | Фиксация поведения счетчика при откате | Задача 4 | `tests/integration/product-requests.test.ts` | В процессе |
| PRQ-20 | Доступ к управлению только с правом `product_requests:manage` | Задача 5 | `tests/integration/product-requests.test.ts` | В процессе |
| PRQ-21 | Карточка содержит все поля, tel/mailto, историю изменений | Задача 5 | `tests/e2e/product-requests.spec.ts` | В процессе |
| PRQ-22 | При первом ответе `assigned_to` устанавливается текущим менеджером | Задача 5 | `tests/integration/product-requests.test.ts` | В процессе |
| PRQ-23 | Переназначение ответственного администратором | Задача 5 | `tests/integration/product-requests.test.ts` | В процессе |
| PRQ-24 | Оптимистичная блокировка `version`, 409 при конфликте | Задача 5 | `tests/integration/product-requests.test.ts` | В процессе |
| PRQ-25 | Увеличение `version` и обновление `updated_at` при успешном сохранении | Задача 5 | `tests/integration/product-requests.test.ts` | В процессе |
| PRQ-26 | Аудит `product_request.responded` с diff статуса | Задача 5 | `tests/integration/product-requests.test.ts` | В процессе |
| PRQ-27 | Покупатель не может менять заявку, только чтение своей | Задача 5 | `tests/integration/product-requests.test.ts` | В процессе |
| PRQ-30 | Изоляция: покупатель видит только свои заявки, чужая → 404 | Задача 5 | `tests/integration/product-requests.test.ts` | В процессе |
| PRQ-31 | Маскирование телефона и email в логах | Задача 1, 4 | `tests/unit/request.test.ts` | В процессе |
| PRQ-32 | Защита от межсайтовых мутаций для изменяющих API | Задача 1, 4 | `tests/unit/request.test.ts` | В процессе |
| PRQ-33 | Серверная проверка прав на каждом обработчике | Задача 5 | `tests/integration/product-requests.test.ts` | В процессе |
| PRQ-34 | Экранирование пользовательского ввода от XSS | Задача 4, 5 | `tests/e2e/product-requests.spec.ts` | В процессе |
| AC-PRQ-1 | Гость создает заявку: HTTP 201, `PRQ-NNNN` | Задача 4 | `tests/integration/product-requests.test.ts` | В процессе |
| AC-PRQ-2 | Название из 1 символа → 400 у поля `productName` | Задача 4 | `tests/unit/product-requests.test.ts` | В процессе |
| AC-PRQ-3 | `quantity = -1` → 400 | Задача 4 | `tests/unit/product-requests.test.ts` | В процессе |
| AC-PRQ-4 | Телефон `92 123 45 67` сохранен как `+992921234567` | Задача 1, 4 | `tests/unit/system.test.ts` | В процессе |
| AC-PRQ-5 | 11-я заявка за час с одного IP → 429 с `Retry-After` | Задача 1, 4 | `tests/integration/product-requests.test.ts` | В процессе |
| AC-PRQ-6 | Покупатель видит свою заявку в `/account/requests`, чужую — нет | Задача 5 | `tests/e2e/product-requests.spec.ts` | В процессе |
| AC-PRQ-7 | Покупатель без права на `/api/product-requests` → 403 | Задача 5 | `tests/integration/product-requests.test.ts` | В процессе |
| AC-PRQ-8 | Менеджер отвечает, заявка получает `AVAILABLE`, `version` +1 | Задача 5 | `tests/integration/product-requests.test.ts` | В процессе |
| AC-PRQ-9 | Две параллельные отправки одной версии → 200 и 409 | Задача 5 | `tests/integration/product-requests.test.ts` | В процессе |
| AC-PRQ-10 | Цена 8 500,00 TJS хранится как 850000 дирамов и форматируется как 8 500,00 TJS | Задача 1, 5 | `tests/unit/system.test.ts` | В процессе |
| AC-PRQ-11 | XSS в описании экранируется в кабинете и админке | Задача 5 | `tests/e2e/product-requests.spec.ts` | В процессе |
| AC-PRQ-12 | Уникальность номеров при 20 одновременных созданиях | Задача 4 | `tests/integration/product-requests.test.ts` | В процессе |

---

## 3. Реферальная система (REF, AC-REF)

| ID | Требование | Задача реализации | Запланированные тесты / артефакты | Статус |
|---|---|---|---|---|
| REF-01 | 8 символов hex uppercase (`AB12CD34`) | Задача 7 | `tests/unit/referrals.test.ts` | В процессе |
| REF-02 | Генерация через `crypto.randomBytes(4)` | Задача 7 | `tests/unit/referrals.test.ts` | В процессе |
| REF-03 | Partial unique индекс `referral_code` | Задача 7 | Миграция, DB checks | В процессе |
| REF-04 | Ленивая генерация при первом обращении | Задача 7 | `tests/integration/referrals.test.ts` | В процессе |
| REF-05 | Атомарный UPDATE при установке, до 5 повторов при коллизии | Задача 7 | `tests/integration/referrals.test.ts` | В процессе |
| REF-06 | Ошибка 500 и лог после 5 коллизий | Задача 7 | `tests/unit/referrals.test.ts` | В процессе |
| REF-07 | Код неизменяем после назначения | Задача 7 | `tests/integration/referrals.test.ts` | В процессе |
| REF-08 | Обработка коллизий в пространстве 2^32 | Задача 7 | `tests/unit/referrals.test.ts` | В процессе |
| REF-09 | Код не содержит персональных данных пользователя | Задача 7 | `tests/unit/referrals.test.ts` | В процессе |
| REF-10 | Формат ссылки `{baseUrl}/r/{CODE}` | Задача 7 | `tests/unit/referrals.test.ts` | В процессе |
| REF-11 | `baseUrl` строго из `APP_URL`, не из заголовка `Host` | Задача 7 | `tests/unit/referrals.test.ts` | В процессе |
| REF-12 | Поле только для чтения + Clipboard API | Задача 7 | `tests/e2e/referrals.spec.ts` | В процессе |
| REF-13 | Fallback выделения текста и Ctrl+C при недоступности буфера | Задача 7 | `tests/e2e/referrals.spec.ts` | В процессе |
| REF-14 | Мобильная кнопка «Поделиться» при поддержке | Задача 7 | `tests/e2e/referrals.spec.ts` | В процессе |
| REF-20 | HTTP 307 редирект на `/auth/register?ref={code}` | Задача 7 | `tests/integration/referrals.test.ts` | В процессе |
| REF-21 | Валидация формата `^[0-9A-Fa-f]{8}$` | Задача 7 | `tests/unit/referrals.test.ts` | В процессе |
| REF-22 | Неверный формат редиректит на `/auth/register` без `ref` | Задача 7 | `tests/integration/referrals.test.ts` | В процессе |
| REF-23 | Параметр `ref` в URL безопасно закодирован | Задача 7 | `tests/unit/referrals.test.ts` | В процессе |
| REF-24 | Авторизованный пользователь перенаправляется в кабинет `/account/referral` | Задача 7 | `tests/integration/referrals.test.ts` | В процессе |
| REF-25 | Заголовки `noindex` и `no-store` для `/r/[code]` | Задача 7 | `tests/integration/referrals.test.ts` | В процессе |
| REF-26 | Не раскрывать существование кода на этапе перехода | Задача 7 | `tests/integration/referrals.test.ts` | В процессе |
| REF-27 | Реферальная cookie (по решению #58) | Задача 7 | `tests/integration/referrals.test.ts` | В процессе |
| REF-30 | Сбой реферала не должен отменять регистрацию клиента | Задача 7 | `tests/integration/referrals.test.ts` | В процессе |
| REF-31 | Схема `refCode` в `registerSchema`: опционально, до 16 симв, trim | Задача 7 | `tests/unit/referrals.test.ts` | В процессе |
| REF-32 | Связь однократна и не меняется после регистрации | Задача 7 | `tests/integration/referrals.test.ts` | В процессе |
| REF-33 | DB CHECK: запрет ссылки на самого себя | Задача 7 | `tests/integration/referrals.test.ts` | В процессе |
| REF-34 | Проверка статуса приглашающего при начислении | Задача 7 | `tests/integration/referrals.test.ts` | В процессе |
| REF-35 | `source = 'referral'` ставится только при реальной валидной связке | Задача 7 | `tests/integration/referrals.test.ts` | В процессе |
| REF-40 | Скелетон загрузки и понятная ошибка при сбое API | Задача 7 | `tests/e2e/referrals.spec.ts` | В процессе |
| REF-41 | Числа форматируются по локали | Задача 7 | `tests/e2e/referrals.spec.ts` | В процессе |
| REF-42 | Данные возвращаются только по текущему пользователю | Задача 7 | `tests/integration/referrals.test.ts` | В процессе |
| REF-43 | Пользователю без `customers` возвращается 403 / предупреждение | Задача 7 | `tests/integration/referrals.test.ts` | В процессе |
| REF-44 | Пункт в меню кабинета с активной подсветкой | Задача 7, 12 | `tests/e2e/navigation.spec.ts` | В процессе |
| AC-REF-1 | Первый вызов `/account/referral` генерирует код, повторный возвращает тот же | Задача 7 | `tests/integration/referrals.test.ts` | В процессе |
| AC-REF-2 | Параллельные первые запросы дают один и тот же код | Задача 7 | `tests/integration/referrals.test.ts` | В процессе |
| AC-REF-3 | `/r/ab12cd34` → 307 на `/auth/register?ref=AB12CD34` | Задача 7 | `tests/integration/referrals.test.ts` | В процессе |
| AC-REF-4 | `/r/<script>` → 307 на `/auth/register` без `ref` | Задача 7 | `tests/integration/referrals.test.ts` | В процессе |
| AC-REF-5 | Регистрация с валидным кодом создает `PENDING` бонус и аудит | Задача 7 | `tests/integration/referrals.test.ts` | В процессе |
| AC-REF-6 | Несуществующий код: регистрация успешна, связь не создана | Задача 7 | `tests/integration/referrals.test.ts` | В процессе |
| AC-REF-7 | Счётчики на странице точно соответствуют базе | Задача 7 | `tests/integration/referrals.test.ts` | В процессе |
| AC-REF-8 | Запрет связи с самим собой на уровне БД | Задача 7 | `tests/integration/referrals.test.ts` | В процессе |
| AC-REF-9 | Ссылка построена на `APP_URL`, не на `Host` | Задача 7 | `tests/unit/referrals.test.ts` | В процессе |
| AC-REF-10 | Кнопка «Скопировать» работает с буфером и fallback | Задача 7 | `tests/e2e/referrals.spec.ts` | В процессе |

---

## 4. База данных и миграции (DB)

| ID | Требование | Задача реализации | Запланированные тесты / артефакты | Статус |
|---|---|---|---|---|
| DB-01 | Порядок применения миграций сохранен (0000–0005, далее 0006+) | Задачи 0, 4, 7, 9, 13 | `drizzle/meta/_journal.json` | В процессе |
| DB-02 | Миграции идемпотентны с guards для DDL | Задача 13 | `npm run db:migrate` на чистой и наполненной БД | В процессе |
| DB-03 | Описание отката в `docs/MIGRATIONS_AND_ROLLBACK.md` | Задача 13 | `docs/MIGRATIONS_AND_ROLLBACK.md` | В процессе |
| DB-04 | Тестовый прогон перед production на резервной копии | Задача 13, 14 | Протокол приёмки | В процессе |
| DB-05 | Отсутствие долгих блокировок при batch updates | Задача 13 | Протокол миграций | В процессе |
| DB-06 | Непрерывность и уникальность журнала миграций | Задача 13 | Журнал Drizzle | В процессе |

---

## 5. Нефункциональные требования (NFR)

| ID | Требование | Задача реализации | Запланированные тесты / артефакты | Статус |
|---|---|---|---|---|
| NFR-01 | `/terms` TTFB ≤ 300 мс без БД | Задача 13 | Скрипт замеров `scripts/smoke.mjs` | В процессе |
| NFR-02 | Создание заявки p95 ≤ 500 мс | Задача 13 | `scripts/load-product-requests.mjs` | В процессе |
| NFR-03 | Список заявок при 10 000 записей ≤ 1 с | Задача 13 | `scripts/load-product-requests.mjs` | В процессе |
| NFR-04 | `GET /api/account/referral` p95 ≤ 300 мс | Задача 13 | Нагрузочный замер | В процессе |
| NFR-SEC | Rate limiting, masking PII, Origin/Fetch Metadata CSRF check | Задача 1, 4, 7 | `tests/unit/request.test.ts`, `tests/unit/api-errors.test.ts` | В процессе |
| NFR-A11Y | Связанные label, aria-describedby, фокус на ошибках, клавиатура, контраст | Задача 3, 4, 12 | `tests/e2e/accessibility.spec.ts` | В процессе |
| NFR-I18N | Отсутствие хардкода текстов ошибок и интерфейса; русский словарь, tg fallback | Задача 12 | Проверка словарей | В процессе |
| NFR-RESP | Поддержка 360 px без горизонтального переполнения | Задача 3, 4, 6, 12 | E2E Playwright 360px viewport | В процессе |
| NFR-OBS | Health/readiness эндпоинты, outbox dead-letter, структурированные логи без секретов | Задача 8, 14 | `/api/health`, `/api/ready` | В процессе |


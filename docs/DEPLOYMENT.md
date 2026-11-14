# Развёртывание и проверка выпуска

Текущая архитектура: Next.js/Node.js, PostgreSQL, Railway. Переезд на другой стек не требуется.

- Рабочее развёртывание и переменные: [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md).
- Резервирование и восстановление: [инструкция](../ops/backups/README.md).
- Защита: [SECURITY.md](SECURITY.md).
- Приёмочные проверки: [ACCEPTANCE.md](ACCEPTANCE.md).
- Демонстрация: [DEMO.md](DEMO.md).
- Текущее состояние и внешние зависимости: [PROJECT_STATE.md](PROJECT_STATE.md).

Перед публикацией: `npm run check:release`. После публикации отдельно подтвердите успешный запуск web, notification-worker и quotation-worker, основной HTTPS-адрес и вход сотрудника. Зелёная сборка не подтверждает модерацию Payom, HTTPS старого хостинга или юридические реквизиты.

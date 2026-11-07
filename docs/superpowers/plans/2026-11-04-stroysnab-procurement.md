# Stroysnab procurement implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development for independent tasks, inline execution for linked procurement code. No commits or deployment requested.

**Goal:** Закрыть сценарий закупки по списку и улучшить витрину/кабинет.
**Architecture:** Existing Next.js + Drizzle; separate procurement requests, quotation snapshots, private attachments and payment ledger linked to orders.
**Tech Stack:** TypeScript, Next.js, PGlite/PostgreSQL, existing PDFKit and XLSX parser.
**Spec:** docs/superpowers/specs/2026-11-04-stroysnab-procurement-design.md

## Global constraints
Preserve user changes and button motion. No dependency installation, real mail, bank integration or deployment. Use separate test database. Existing supplier order boundaries and 7/5/3 markup remain.

## Review focus
Tenant isolation; repeated concurrent actions; untrusted files; immutable quote price snapshots; payment/refund accounting.

## Tasks
- [x] Catalog and product: inspect medteck reference; add 20/50/100 URL pagination; remove screenshot block; rebuild detail without video. Browser checks filter retention and product purchase.
- [x] Merchandising: new independent home-collection schema/service, admin picker and two 8-item sections. Test limits, hidden products and permission. Migration 0012 reserved for this task; root owns journal registration.
- [x] Procurement domain: tables/migration 0013, request/import/attachment, quote lifecycle, accept→order, payment ledger and targeted integration tests written first. Root owns schema index, journal, orders and procurement APIs.
- [x] Procurement interfaces: public request form/tracking, admin queue/editor, buyer quote actions/PDF; payment controls on order pages. Browser lifecycle including denied access.
- [x] Account redesign: current overview/profile/orders/nav only, consume payment summary service; root adds procurement pages. Preserve working auth and profile update endpoints.
- [x] Brand, integration, security review, type/lint/unit/browser/build checks, rendered desktop/mobile review, report and running local preview.

## Execution ledger
Work on existing codex branch with baseline snapshot; avoid isolating away uncommitted user work.
| Tasks | Shared interface | Ruling |
|---|---|---|
| Catalog / merchandising | catalog service | Catalog owns existing service edits; merchandising uses separate service without changing it. |
| Merchandising / procurement | migrations/schema index | Separate schema files; root registers 0012/0013 and exports. |
| Account / procurement | payment summary | Root exports getOrderPaymentSummary(orderId), returns status, paidDirams, totalDirams, balanceDirams as strings. |
| Catalog | reference only | medteck files read-only; use own design CSS scoped to product. |
| Procurement | request and order roles | Use existing product_requests:manage for requests; orders:manage for payment recording. |
| Account | owner queries | Derive owner from session, never query by customer-supplied identity. |

## Продолжение 2026-11-05
Подключены API создания/списка/деталей закупочной заявки, сохранения и решения по КП, журнал оплат административного заказа. TypeScript проходит. Ещё нужны интерфейсы закупки/редактора КП/просмотра покупателя, приватные вложения и импорт, PDF, визуальная проверка и полная интеграция оплаты в страницы. Не объявлять весь сценарий готовым.


## Завершение 2026-11-05
Полный сценарий, вложения, PDF Courier и интерфейсы завершены. Финальные результаты и границы: docs/audit/2026-11-05-procurement.md.

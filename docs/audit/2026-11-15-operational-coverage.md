# Operational regression coverage — 2026-11-15

The claim that delivery, notifications, payments, and administration have no tests is contradicted by the repository. Existing tests cover important behavior, although that does not establish complete operational or browser coverage.

## Existing evidence

| Area                       | Existing integration evidence                     | Scope and limits                                                                                                                                                                                |
| -------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Delivery                   | `tests/integration/delivery-assignment.test.ts`   | Assignment, phone normalization, unchanged order status, stale edits, unauthorized customer, pickup rejection.                                                                                  |
| Notification callbacks     | `tests/integration/notification-callback.test.ts` | Raw-body HMAC authentication, transport/timestamp/signature/size rejection, retryable unknown provider ID, accepted-attempt state, exact replay, retry and out-of-order failure after delivery. |
| Notification worker/outbox | `tests/integration/notifications.test.ts`         | Atomic queuing, audience isolation, link privacy, disabled transport, bounded retries, acceptance versus delivery, worker leases, global daily budget and expired final attempts.               |
| Payments/refunds           | `tests/integration/procurement.test.ts`           | Customer denial, duplicate partial payment, overpayment rejection, full payment and full refund within a procurement-to-order flow.                                                             |
| Administration             | `tests/integration/admin-audit.test.ts`           | Category cycles and visibility, staff role synchronization, pagination, super-admin escalation/last-admin protection, owner replacement, shop membership conflicts and moderation reasons.      |
| Data audit                 | `tests/integration/data-audit.test.ts`            | Detects an inconsistent order line sum and checks price-history protection. This is a data consistency report, not a financial reporting feature.                                               |

No dedicated business reports module or report-specific integration suite was identified in `src/app`, `src/modules`, or `tests`. A claim about missing report coverage needs a defined reporting contract; this audit does not claim that business reporting is implemented or verified.

## Added behavior checks

`tests/integration/payment-ledger-boundaries.test.ts` exercises the real service and database, with independently chosen integer amounts:

- A payment replay leaves exactly one ledger entry, one audit record and one queued customer notification. Reusing its key with changed kind, amount, reason, method or reference is rejected without side effects.
- Concurrent distinct payments cannot both consume the same remaining balance. Concurrent refunds cannot both consume the same paid balance. Rejected operations leave no additional ledger, audit or outbox records.
- Customer, logistics, procurement, content and supplier roles cannot record either payments or refunds. Invalid positive-integer inputs and a refund without receipts leave the complete accounting/outbox snapshot unchanged.
- Exact payment reaches PAID; cancellation blocks new receipts; an exact refund reaches REFUNDED and safely replays. A further refund is rejected without side effects.

`tests/integration/delivery-conflict-integrity.test.ts` adds:

- Competing edits using one version yield one winner and one conflict. The surviving assignment matches its sole audit record, keeps the order status and advances the version. A later unauthorized edit changes neither order nor audit.
- A real audit foreign-key failure after the assignment update rolls back the entire order mutation and leaves no audit record. This specifically detects loss of transaction atomicity.

These tests do not call external providers or production services, and do not assert a rounding policy. Payment tests queue local outbox rows without dispatching them. They clean up their own fixtures. Concurrent service calls on PGlite exercise application transaction boundaries; this does not replace a separate deployment PostgreSQL stress/load test.

## Verification

- Targeted ESLint passed for both new files.
- Targeted Vitest passed: 2 files, 6 tests, 11.09 seconds, using a new isolated database under `%TEMP%/stroyhub-coverage-nov15-caa69b19-cf2e-4c0d-8ac3-cbb26009a9c4` with `DATABASE_URL` empty and SMS/email sending disabled.
- An earlier fresh-database attempt exposed a migration constraint/type incompatibility before test setup completed. The migration owner corrected it; the passing targeted run above used another new database after that correction.

The full `npm test` run completed against a separate new database, `%TEMP%/stroyhub-coverage-full-nov15-e1cad3ae-7cdd-43c3-a538-14adc2863326`: 69 files passed, 1 file failed; 263 tests passed and 2 failed, in 142.91 seconds. Both failures were in `tests/unit/order-markup.test.ts`, during concurrent work on the new rounding policy:

- `prices 4999999n dirams at 7 percent`: received `5349999n`, expected the previous floor result `5349998n`.
- `keeps large integers exact and rejects invalid quantities`: received `10133099161583624n`, expected the previous floor result `10133099161583623n`.

Both were reported to the money-policy owner. These failures do not justify changing ledger or delivery behavior, and this run is not a green-suite claim. The new operational suites passed in both targeted and broad runs. No production source was changed for this coverage addition.

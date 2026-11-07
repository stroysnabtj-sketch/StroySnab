# Operational SMS outbox

SMS delivery is **disconnected by default**. The migration and application hooks only persist events. No sending runs automatically from checkout, payment or status requests. Login code settings (`AUTH_SMS_*`) do not enable this adapter.

## Event recipients

| Event                                                          | Customer               | Shop                                                                    |
| -------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------- |
| Order created / confirmed / dispatched / delivered / cancelled | Order's stored phone   | Contact and active owner's phone for each shop with items in this order |
| Payment confirmed                                              | Order's stored phone   | None                                                                    |
| Shop portion status changed                                    | None                   | Only the affected shop's contact and active owner                       |
| Quote published                                                | Request's stored phone | None                                                                    |

Phone numbers normalize to Tajikistan's `+992` format; duplicate event/version/phone/channel combinations create one row. Invalid stored phone numbers are skipped. Messages contain document numbers, statuses and optional protected HTTPS links from `APP_URL`. They contain no items, prices, internal margins, delivery addresses, guest credentials or unrelated shop data. Missing or insecure `APP_URL` means no link.

Hooks must be awaited in the same database transaction as the business change, after inserting the order and its items. A stable version identifies a real transition; repeated calls with that version deduplicate. The queue is committed before any worker can send it.

## Worker and limits

Run one bounded batch explicitly with `npx tsx scripts/notification-worker.ts`. No scheduler is installed. When disconnected, the worker leaves rows and attempt counts untouched. Activated workers use 60-second leases, a batch maximum of 100, five attempts per message by default and exponential retry delay from 30 seconds to one hour. The database locks one global SMS spending counter so simultaneous workers respect the daily attempt cap (100 by default, UTC days). Each attempted send consumes the budget, including failed or interrupted attempts.

Rows are `queued`, `accepted`, `delivered` or `failed`. The gateway response sets `accepted`. An authenticated delivery receipt sets `delivered` or records a provider delivery failure. Expired final attempts become `failed`. Interrupted earlier attempts can retry with the same provider idempotency key. Exactly-once external delivery depends on the gateway honoring that key.

Authorized staff with `orders:manage` can inspect masked delivery statuses through `GET /api/admin/notifications?state=failed` (last 100 rows) and explicitly requeue a failed row with `POST /api/admin/notifications` and JSON `{ "id": "..." }`. The POST enforces the application's same-origin rules and writes an audit event in the retry transaction. Requeue preserves attempt history, resets the per-cycle attempt counter and retains the original provider idempotency key. The daily cap still applies. Accepted messages cannot be requeued through this endpoint.

## Gateway configuration (not enabled or tested with a real provider)

Before enabling sending, choose and verify the provider, sender, permitted recipient numbers and notification policy. The generic HTTP contract must be adapted if the provider uses a different API.

- `NOTIFICATIONS_SMS_ENABLED=true` explicitly activates the adapter.
- `NOTIFICATIONS_SMS_SEND_URL` is an HTTPS endpoint without embedded credentials.
- `NOTIFICATIONS_SMS_SEND_TOKEN` supplies the bearer token.
- `NOTIFICATIONS_SMS_SENDER` supplies the agreed sender identifier.
- `NOTIFICATIONS_SMS_DAILY_LIMIT` optionally changes the daily attempt cap (1–10000).

The adapter posts `{sender, recipient, text, idempotencyKey}` with bearer authorization and `Idempotency-Key`. It requires a successful HTTP response with `{accepted: true, messageId: "..."}`. It refuses redirects and times out after ten seconds. Provider response bodies and thrown errors are never placed in the delivery log; errors use fixed codes.

## Delivery receipts

`POST /api/notifications/sms/callback` accepts HTTPS requests when `NOTIFICATIONS_SMS_CALLBACK_SECRET` contains at least 32 bytes. Use a random secret shared with the gateway. If a reverse proxy terminates TLS, preserve the external HTTPS scheme and strip forwarded scheme headers from untrusted callers.

Send `application/json` with a UTF-8 body of at most 4096 bytes, using `{"messageId":"…","status":"DELIVERED"}` or `{"messageId":"…","status":"FAILED"}`. The ID must match the gateway's acceptance response. Set `x-sms-timestamp` to the current Unix time in seconds and `x-sms-signature` to the hex HMAC-SHA256 of the timestamp, a literal `.`, and the exact body bytes. The server allows five minutes of clock skew.

The callback returns an empty `204` when a matching receipt has been processed. If acceptance has yet to commit or the ID cannot be resolved unambiguously, it returns `503` with `Retry-After: 5`. Exact signed replays are idempotent, including after a staff retry. Delivery can supersede an earlier provider failure. A later failure leaves delivery intact. The audit entry stores only the internal notification ID and receipt status. The corresponding attempt records the outcome and retains its original send completion time.

Tests use a fake gateway and separate PGlite data. Real SMS and provider receipts remain unverified.

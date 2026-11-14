# Security operations

Staff sign-in requires a password and a five-minute email code when `STAFF_EMAIL_OTP_REQUIRED=true`. Password recovery resets the password but requires a fresh staff sign-in before access is granted. Existing sessions remain valid until expiry or revocation. Staff accounts need a working email address and email delivery configuration.

Customer authentication retains its phone/email verification, password recovery, consent and CAPTCHA checks. Keep Turnstile, per-account/IP limits and SMS limits enabled. SMS transport success must be verified separately from queue processing.

HTML responses use a fresh CSP nonce. Production scripts do not allow unsafe-eval. HTTPS responses set HSTS for the current hostname only. Do not enable includeSubDomains or preload until the apex domain and mail services have valid HTTPS where applicable.

Price history records future changes to supplier prices, product markups and pricing rules through database triggers. Application UPDATE, DELETE and TRUNCATE of the history are blocked; a database owner can still alter these protections. Restrict database-owner access and retain independent backups. Admin pricing history contains procurement costs and requires pricing:manage permission.

Run `npm run audit:data` against the configured database to check financial totals, payments, stock/reservations and history protections. The production command reads a consistent snapshot without repairs or migrations. Investigate findings before modifying historical records.

Keep API keys in Railway variables, never in source, screenshots or logs. Rotate previously shared credentials through their provider consoles. Database restoration procedure: see ops/backups/README.md.

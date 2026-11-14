# Threat model — launch hardening

Assets: customer contacts and addresses, staff sessions, commercial quotations, orders/payments, procurement prices, uploaded documents and provider credentials.

Trust boundaries: browser/API, user-owned resources, staff permission checks, file extraction/model output, notification providers, PostgreSQL and object storage. AI matching output must never supply authoritative prices or bypass catalogue/quantity validation.

Controls verified by the test suite include resource ownership and RBAC, explicit writable fields, request validation, output escaping, authentication attempt limits, OTP expiry/single use, staff password plus email verification, nonce CSP and transactional pricing/stock operations. These controls reduce risk; they do not establish that every possible vulnerability has been eliminated.

Operational risks: compromised email can expose staff OTPs; a stolen existing session remains usable until revoked; database owners can alter audit triggers; provider errors can delay SMS; model matches can be incorrect; public endpoints still require monitoring and capacity limits. Restore backups into an isolated database and verify them before replacing production.

# Project state — 2026-11-14

StroySnab operates as one online store. Suppliers are internal procurement metadata; supplier accounts and public marketplace selection must not be restored. Payments currently use cash. Product markups are configured per product.

Automatic file quotations use catalogue-backed matching and label alternatives; prices and quantities are validated by the application. Email delivery and SMS delivery are separate operations. SMS messages contain no links; email links use https://www.stroysnab.tj.

Launch hardening adds staff password + email OTP, per-response CSP nonces, HTTPS HSTS, protected database price history and a read-only integrity command. Configuration and migration must be deployed together. See SECURITY.md and superpowers/plans/2026-11-14-launch-hardening.md.

External unresolved items:
- Payom notifications now use number-1/text-1 and dedicated order/admin/request templates. New IDs supplied on 2026-11-14 are still shown as MODERATION in the owner screenshot; actual delivery remains unverified until approval. Authentication retains the existing working code template. Queue processing alone does not confirm delivery.
- Apex stroysnab.tj still requires a valid HTTPS endpoint and permanent redirect to www; the previous hosting configuration is separate from Railway www routing.
- Legal operator details await the owner's information. Do not invent company registration details.

Backups: scheduled database and file backups exist. A fresh database backup was restore-verified before these migrations on 2026-11-14 at 04:35 UTC, covering 39 pre-migration tables. See ops/backups/README.md for operation and recovery.

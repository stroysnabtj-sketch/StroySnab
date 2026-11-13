# Immediate notifications and password feedback

- SMS bodies are link-free for customers, admins and quotation events. Payom order/status transport continues to send approved template variables only.
- Email order links are built at dispatch using the canonical SITE_URL, including queued messages which contained an older host. Guest links remain signed, expiring and private. Website APP_URL and worker SITE_URL explicitly use https://www.stroysnab.tj.
- Persistent PostgreSQL LISTEN/NOTIFY worker replaces five-minute cron. Notifications wake it only after transaction commit. A ten-second recovery scan handles due retries or a missed signal. Existing cutoff, budgets, claims and deduplication remain intact. Provider/network delivery time remains external.
- Password requirements use the same validation function on server and UI. Length, upper/lowercase, digit and symbol each receive a green check when met, with 180ms transitions and reduced-motion support. Registration and password recovery share this UI.
- Tests cover link-free SMS, canonical signed email links with an obsolete APP_URL, validation consistency, and wakeups retained during dispatch. No extra paid SMS tests sent.

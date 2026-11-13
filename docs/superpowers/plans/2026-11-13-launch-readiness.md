# Launch readiness implementation plan

> Execute inline using superpowers:executing-plans. User authorized the remaining launch work on 13 November 2026.

**Goal:** Enable new order notifications, product-specific pricing, verified file backups and current Railway configuration; verify public domain/SEO and the buying flow.

**Architecture:** Existing PostgreSQL outbox and separate worker; approved Payom template IDs, Resend emails. Product markup stored as a decimal percent, calculated with integer money and applied to unit price before quantity. Preserve historical order/quotation snapshots. Backup source files read-only to the existing private backup bucket with immutable manifests and checksums.

**Constraints:** Cash payments only. AI quotation excluded. Legal operator details deferred by user. Preserve user files and existing design. No old demo notifications; activation cutoff. No supplier identities or wholesale/markup data in public responses. No paid SMS tests beyond authorized events.

- [ ] Notifications: failing payload tests; add explicit event metadata, approved templates, unsupported-event filtering; configure separate worker and new-event cutoff, verify logs without sending old events.
- [x] Pricing: failing mixed-rate/cart/order/quotation tests; product markup field with default 7%, validated admin input and audit; apply across catalog, cart, checkout and manually prepared quotations; remove basket tiers from active UI/API; preserve snapshots and hide private fields.
- [x] Backups: file backup tests; snapshot source objects into private backup bucket, verify round trip; configure scheduled service and inspect successful database backup.
- [ ] Railway: translate/import existing configuration, inspect plan before applying; retain service identities and storage; deploy and check health.
- [ ] Domains/SEO: inspect HTTP/HTTPS/root/www/sitemap/robots and canonical URLs; fix application issues, record any external DNS requirements.
- [ ] Release: targeted tests, lint/build and meaningful integration buying flow; fresh review; deploy and verify production. Report completed work and external blockers precisely.

Review: service-level pricing permission added after fresh review. Quotation-to-order copies email and uses cash payment. Public DTOs omit supplier costs and markup. Root HTTPS remains an external hosting certificate issue.

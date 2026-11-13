# Automatic quotation delivery — 2026-11-13

Replaces the previous manager-review release at the user's explicit request.

- The request form/title are centered; the provider/manager helper sentence is removed. Automatic mode requires an email address and remains a visible choice.
- DeepSeek extracts document lines. Catalogue selection uses a bounded shortlist and a deterministic ranking threshold of70, not a calibrated accuracy percentage. Exact matches may publish directly; other eligible matches are clearly labelled alternatives in line names and conditions. Numeric specifications, dimension suffixes, ordered dimensions, sale units, minimum quantities and cumulative stock remain safeguards.
- Valid lines are automatically published as a SENT quotation. Unresolved lines are excluded from totals and listed explicitly before optional notes. Catalogue prices and per-product markup are rechecked in the save transaction. No valid priced lines produces a result email, never invented prices. Existing manager edits/closed requests remain protected.
- The email outbox sends a PDF attachment plus canonical authenticated request link. Only the current SENT version is rendered; stale queued versions are cancelled. Original SMS templates and link-free SMS are unchanged. Recipient email is validated server-side.
- The notification worker bundles the CommonJS PDFKit entry explicitly; the default ESM entry and Next-pruned CommonJS entry were both unsuitable for this standalone process. The bundled runtime was verified against a real test quotation, producing a valid46KB PDF.

Validation: mock email transport verifies the Resend attachment/subject; integration verifies automatic publication, customer cost privacy, generated PDF attachment, alternative labelling, partial totals and duplicate-demand stock bounds. Unit cases reject wrong grade, millimetre/metre/centimetre and weight mismatches. Responsive form checks passed at390/1440px. Production build passed. Full suite passed: 57 files / 229 tests. Railway status is reported with deployment.

No new live customer emails or paid SMS were sent during checks. Provider acceptance/delivery will be visible in notification logs when a customer submits a new automatic request.

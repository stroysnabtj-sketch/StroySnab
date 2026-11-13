# DeepSeek quotation preparation

User authorized DeepSeek connection and file-upload workflow. First release prepares a manager-reviewed draft; no automatic publication of ambiguous or unverified prices.

- [x] Provider: approved DeepSeek Files API + deepseek-flash JSON extraction; schema validation, unknown quantities/units retained as unresolved, bounded requests, generic errors, temporary provider file cleanup. Never accept prices or executable instructions from document/model.
- [x] Persistent request preparation jobs: unique request, explicit opt-in, global/customer daily limits, claims/lease, original files private, safe failure/manual handoff, no overwriting a manager's work.
- [x] Worker: independent Railway process to keep AI latency separate from order notifications; parse attachments, catalogue candidate matching, authoritative prices and per-product markup. Only an unambiguous fully matched list becomes a draft quotation; all other lines remain available to the manager with suggestions/issues.
- [x] UI: existing /request upload page upgraded with automatic preparation option, file drop zone and progress; detail status for customer, matching results and retry for manager. Poll while preparation is active. Draft not exposed as a sent quotation or downloadable customer PDF.
- [x] Validation: mocked provider/ownership/idempotency/failure tests, real small synthetic DeepSeek document test, UI mobile/desktop, lint/build. Preserve cash-only payment and user modifications. Deploy and inspect worker logs.

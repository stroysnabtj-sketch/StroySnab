> Historical note: daily quotas described below were removed on 2026-11-14 at the owner's request. See PROJECT_STATE.md and the current gaps reconciliation.

# DeepSeek quotation preparation

- Customer opts in at `/request` and uploads DOCX, XLSX, UTF-8 CSV, PDF, JPEG or PNG (5 files, 10 MB each). Originals remain private. Provider receives file bytes under a generic filename; temporary provider files expire in one hour and are deleted after processing where possible.
- Persistent PostgreSQL queue, separate Railway quotation worker, 20 submissions per rolling day globally and 3 per customer. No automatic paid retry after errors or expired leases. A manager can retry once before manual handoff.
- Model extracts only material names, quantities and units. Strict JSON validation; missing values remain unresolved. Catalogue matching accepts exact unique product matches with correct units, available stock and minimum quantity. Prices and markup come exclusively from catalogue services.
- Complete matches produce an unpublished quotation draft. Other results become editable manager suggestions. A manager reviews and sends the quotation through the existing workflow. Customers cannot download unpublished drafts or see supplier costs.
- Request/job locks and expected update timestamps protect manager edits and rejected requests. File failures preserve the original request. Keys stay in Railway variables; no secrets in repository or client props.

Validation: full suite 56 files / 225 tests passed; focused provider and job tests passed again after claim/state guards, including role-restricted manual retry capped at two attempts. Production build and lint passed. Real DeepSeek Files + chat + delete flow checked with a synthetic two-row CSV. Browser upload/opt-in/responsive checks passed at 390 and 1440 px. Fresh review findings addressed: expired claims, rejection race, editor refresh and explicit opt-in.

Deployment uses an independent `StroySnab-quotation` service with database/storage/key references. Deployment runtime verification is recorded separately in the final response.

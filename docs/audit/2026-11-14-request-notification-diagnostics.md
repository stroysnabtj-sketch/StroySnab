# Request contact, quote matching and notification diagnostics — 2026-11-14

Confirmed against production with read-only DB diagnostics and one targeted retry of the latest failed SMS to the customer's previously authorized number:
- RFQ-0002 produced a SENT quote and an accepted Resend email. The user's Resend screenshot confirms Delivered.
- QUOTE_READY SMS was excluded from the transport supported-event list and remained queued without attempts.
- Latest ORDER_CREATED SMS failed despite containing no URL. Payom accepted authentication/balance lookup, but the message endpoint returned HTTP422 with `templateMessage.variables[order]` and `[status]`: variable forbidden. This is an external provider/template configuration block, not a link error. No blanket retries were enabled.

Fixes:
- New material-list submissions enqueue REQUEST_RECEIVED SMS/email in their creation transaction, deduped by request. REQUEST_RECEIVED and QUOTE_READY use existing approved status template metadata; SMS contains no link. Payom's specific forbidden-variable error is stored as a whitelisted code and shown in admin notifications without logging raw provider bodies.
- Request phone field has a fixed +992 prefix, grey national placeholder, paste normalization, nine-digit validation and canonical hidden form value.
- Map tile images explicitly use referrerPolicy origin. Private request page retains no-referrer for other resources; only the site origin is sent to the OSM tile service, satisfying its required Referer without leaking private paths/tokens.
- Cement grade OCR repair is limited to the known ДО/DO vs Д0 context. Numeric grades such as Д20 remain distinct. Existing accepted order prices are untouched.

Validation: full230-test suite passed before safe provider diagnostics enhancement; affected SMS/matching/quote/notification tests passed again after it (14 tests), plus7 notification integration tests including request-received metadata and link-free SMS. Production build passed. Browser verified +992 prefix, blank placeholder, full-number paste, canonical value, short-number rejection, and actual origin-only tile Referer on a private request page.

External action: ask Payom to permit `order` and `status` variables for template66c03e11-d52b-403b-905a-7761080d3d7c, and `order` for the admin templatecfb6a23b-08b5-47f6-ac43-30cb1d455aee if subject to the same restriction. Retry only an appropriate failed notification once permission is corrected. Existing OTP code template remains separate.

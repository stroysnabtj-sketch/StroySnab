# Automatic quotation publication and email

User explicitly replaced manager approval with automatic publication/email, requested centered form and removal of provider/manager helper text. Preserve explicit automatic checkbox; require recipient email when selected. Similarity score is ranking, not measured accuracy. Prices, markup, units, stock, minimum orders and critical dimensions remain server-authoritative. Non-exact matches are visibly alternatives; unresolved rows excluded from total and listed in conditions. A list with no valid priced lines receives a result email, never fabricated prices.

1. TDD pure matching score/unit normalization; widen bounded candidate retrieval and rank 70+ matches with specification safeguards.
2. Publish validated priced lines automatically under existing request/claim/version guards. Keep requested names, score and alternative metadata in job suggestions. Surface unresolved rows in quotation conditions and send a result email if no lines matched.
3. Add email outbox for quotations and PDF attachment using current published version; ownership check and superseded-version suppression. Keep SMS approved templates and no links untouched.
4. Center /request form/title; remove requested helper text; require/validate automatic recipient email server/client. Update customer preparation labels.
5. Unit/integration/provider/race/mail tests, rendered desktop/mobile, build/lint, fresh review, Git push and Railway runtime verification. No paid SMS or unsolicited real mail tests.

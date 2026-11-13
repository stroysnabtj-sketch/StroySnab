# Launch readiness — 13 November 2026

## Delivered

- Product-specific percentage markup (0–1000%, two decimal places), default 7%; admin product editor and CSV/XLSX import/export. `pricing:manage` required to change a rate. Catalogue/content editors can retain the existing rate while editing content.
- Catalogue, cart, checkout and quotation lines share integer unit-price calculation. No basket-size tiers. Existing orders and published quotations keep stored price snapshots. For catalogue quotation lines the server reads the product rate; separately procured lines accept an explicit rate.
- Historical order percentage remains intact; new per-product orders use legacy aggregate percentage 0, with exact base, markup and retail totals. Database constraints allow both formats and enforce subtotal consistency.
- Payom order/customer-status and admin-new-order templates connected. Worker uses explicit event metadata and never sends private links in SMS template variables. Resend receives order emails with protected links. Accepted status means provider acceptance, not confirmed handset delivery.
- Separate Railway `StroySnab-notifications` service, PostgreSQL outbox, schedule every five minutes, new-event activation cutoff and 100/day budgets per channel. Historical demo queue excluded. Unsupported `QUOTE_READY` SMS remains unsent pending a separate approved template.
- Accepted quotation orders now retain contact email and use cash-on-delivery.
- Railway website moved from `railway.toml` to `.railway/railway.ts`; secrets preserved/referenced on Railway. Database and backup resources are outside this partial's ownership. Removed residual marketplace copy from homepage/catalog/admin descriptions.
- Daily private database and file backups. Verified database restore: 38 tables. Source R2 bucket was empty; one owned 40-byte probe was copied, round-trip SHA-256 verified and source probe removed. Immutable content versions and dated manifests survive source deletion. File snapshots currently have no automatic retention; monitor storage.

## Verification

- Full suite: 53 files, 218 tests passed; additional permission and quotation email/cash tests passed after review fixes.
- ESLint and production build passed.
- Seven Python backup tests passed.
- Browser purchase on local production build: guest cart → order → admin order; customer privacy and retired supplier routes verified. Price editor/calculator checked at 390 and 1440 pixels.
- Runtime dependency audit: zero production vulnerabilities at verification.
- Independent read-only review found pricing-permission and missing-quotation-email issues; both fixed and covered. Replaced new catalogue rate lookup with a map.

## External / deferred

- `https://www.stroysnab.tj`, sitemap and robots respond successfully. `http://stroysnab.tj` redirects to www. `https://stroysnab.tj` fails certificate validation because old hosting serves a self-signed certificate. Install a valid certificate for the root domain on that hosting and retain permanent redirect to `https://www.stroysnab.tj` with path/query preservation, or move root routing to managed HTTPS. DNS/mail records must not be removed.
- Submit `https://www.stroysnab.tj/sitemap.xml` in the owner's Google Search Console. Submission/indexing not confirmed.
- Final legal publication requires company details, deferred by owner. AI quotation and bank payments excluded. Payom delivery receipts are not yet connected; acceptance and delivery are distinct.

Backup instructions: `ops/backups/README.md`. Product markup: `/admin/catalog` → edit product → Наценка, %. Delivery logs: `/admin/notifications` and Railway worker logs.

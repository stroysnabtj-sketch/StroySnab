# STROYHUB marketplace redesign implementation plan

**Goal:** Deliver a coherent storefront, safe checkout and separate platform/shop workspaces using the existing Next.js/Drizzle application.
**Spec:** ../../audit/2026-11-02/AUDIT_AND_REDESIGN_PROPOSAL.md and the user's approval to begin, including the request for concrete commercial copy without generic slogans.
**Architecture:** Preserve authentication, product/offer separation and existing migrations. Scope shop access by membership on the server. Calculate order prices and markup from persisted offers; expose only public DTOs.
**Stack:** Next.js 15, React 19, TypeScript, Drizzle, PostgreSQL/PGlite, existing Lucide icons and CSS. No new dependencies.

## Constraints and rulings

- Work in the current dirty checkout: the uncommitted catalogue/orders/request implementation is the user's starting point and must be preserved, not discarded by a fresh checkout. No commits or publishing requested.
- Implemented interpretation: apply 7% below 50,000 TJS, 5% from 50,000 through 100,000 TJS, and 3% above 100,000 TJS to the basket-wide base product subtotal before markup, excluding delivery. Apply the selected rate to the whole basket base and persist the calculation. Confirm before launch whether the basket threshold should aggregate across stores; do not stack the old legacy markup.
- No fabricated testimonials, promotions, sales statistics, badges, certification/tax promises, availability or live vehicle tracking. Plain Russian labels.
- Keep existing platform staff roles. Shop owner remains SUPPLIER_OWNER; never reinterpret platform ADMIN as shop owner.
- Real product images when present; restrained placeholders otherwise. Responsive at 360/390/768/1440.

## Review focus

- Guest order links require an unguessable access token; UUID alone never authorizes access.
- Posted totals/line names cannot override database prices; repeated checkout cannot duplicate orders.
- A store cannot access another store's products, offers, or order lines.
- Multiple brands, attributes, history navigation and empty facets behave consistently.
- Failed network requests preserve form values and restore actions; keyboard and mobile controls remain usable.

## Tasks

- [x] A. Server-calculated quote/order, markup tests, stock reservation, guest/customer access, idempotency, restrained checkout and order confirmation.
  Files: modules/orders/*, modules/pricing/order-markup.ts, schema/orders.ts, migration 0008, API public/orders, checkout-view, orders/[id]. Tests: unit markup boundaries and integration order ownership/pricing/reserves/idempotency.
- [x] B. Shop workspace: membership-scoped product CRUD, dynamic category attributes, own offers, orders and overview; preserve moderation boundary.
  Files: modules/suppliers/shop-service.ts, API seller/products and seller/orders, seller pages, seller-panel. Tests: two-store isolation and moderation.
- [x] C. Catalogue: brands array, correct facets, remove fake sales metadata, actual images, consistent tree and typed attribute filters.
  Files: modules/catalog/service/types, catalogue page/filter components, admin-catalog-panel. Tests: multi-value filtering and no fabricated badges.
- [x] D. Storefront visual system, header/search/footer, home, tiles/cards, product page/gallery, cart, account and platform navigation/dashboard.
  Files: globals.css and focused CSS, storefront components/pages, account/admin overview. Use real photos already in project; do not source misleading media. Rendered verification instead of implementation-mirroring tests for visual edits.
- [x] E. Integrate, meaningful E2E, lint/typecheck/full tests/production build, responsive screenshots, remove outstanding lint failures and update implementation status.

For behavior changes: reproduce with a failing test, implement, rerun affected tests. Run the full suite after integration rather than launching multiple workers against the same test database. Record tests and remaining limitations in docs/audit/2026-11-02/IMPLEMENTATION.md.

Implementation and verification results: [IMPLEMENTATION.md](../../audit/2026-11-02/IMPLEMENTATION.md). This completes the current code pass; client visual sign-off and production integrations remain separate launch gates.

# Homepage management implementation plan

Goal: mobile catalog and product sections display four cards in two columns, with incremental expansion; staff can edit the existing hero and product advertising placements.

Architecture: preserve the approved hero and existing product collections. A small client wrapper controls mobile expansion with CSS retaining the full desktop grid. Store validated homepage content in the existing settings table; no database migration or new dependencies. Reuse the existing catalog management permission, same-origin checks and audit log.

1. Add server-validated homepage content defaults and settings persistence; test authorization, unsafe links, limits and round trips.
2. Add protected API and a content editor inside the existing homepage administration page. Advertising cards have title, optional photo, product link, button label and visibility; array order is display order.
3. Render managed hero and enabled advertising cards. Replace mobile horizontal scrolling with 2×2 cards, expanding four at a time independently in each section. Desktop remains unchanged.
4. Run relevant integration tests, lint, typecheck, build and browser checks for mobile expansion, desktop layout and the editor/API. Publish the verified revision and inspect production.
5. Report remaining launch work based on current code and configuration; do not claim untested delivery or complete store readiness.

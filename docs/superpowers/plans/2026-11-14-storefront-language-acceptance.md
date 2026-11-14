# Storefront language and continuous acceptance — 2026-11-14

Authorized by the owner: complete remaining launch checks and Tajik localization; preserve the approved design and single-store behavior. No referrals or supplier panels.

Design: request-scoped ru/tg cookie, explicit language switch, server-rendered html lang and client context sharing the same initial locale. Translate interface copy through explicit dictionaries; never translate product specifications or legal content by guessing. Russian remains default. Customer interface first; report untranslated admin/content areas accurately.

1. Add validated locale resolution, cookie endpoint with same-origin guard, provider/switch, dictionary parity tests. Translate navigation/home/product/cart/auth/address copy and supported dictionaries. Verify persistence and SSR language, preserve form drafts on switching by reload only from explicit language action.
2. Add a dedicated production-build Playwright acceptance suite: deterministic local database, mobile/desktop visual baselines, internal links, semantic form labels, keyboard navigation, map tile/selection/reverse-geocode mocks and Turnstile script compatibility under CSP. CI installs Chromium and runs lint/type/unit plus acceptance; never send SMS or provider requests.
3. Mark historical status documents as archived; publish current coverage and commands. Financial audit stays read-only. Verify rounding boundaries without changing settled order snapshots.
4. Run checks, inspect baseline images, commit/push/deploy and inspect runtime. State remaining translation content and external DNS/Payom approval limitations explicitly.

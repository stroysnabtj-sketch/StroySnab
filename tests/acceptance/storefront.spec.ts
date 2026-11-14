import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const pages = [
  "/",
  "/catalog",
  "/auth/register",
  "/auth/password",
  "/cart",
  "/contacts",
  "/delivery",
];
test("public navigation, form accessibility and security headers", async ({ page }) => {
  for (const path of pages) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    expect(response?.headers()["content-security-policy"]).toContain("'nonce-");
    expect(response?.headers()["content-security-policy"]).not.toContain("unsafe-eval");
    await expect(page.locator("h1")).toHaveCount(1);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations.filter((v) => ["critical", "serious"].includes(v.impact || "")),
      path,
    ).toEqual([]);
  }
});
test("language persists across server rendering and navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ба забони тоҷикӣ" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "tg");
  await expect(page.getByRole("heading", { name: "Феҳрист", exact: true })).toBeVisible();
  await page.goto("/auth/register");
  await expect(page.getByRole("heading", { name: "Бақайдгирӣ", exact: true })).toBeVisible();
  await expect(page.getByLabel("Ному насаб", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Переключить на русский" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByRole("heading", { name: "Регистрация", exact: true })).toBeVisible();
});
test("locale endpoint rejects invalid and cross-origin requests", async ({ request }) => {
  expect((await request.post("/api/locale", { data: { locale: "xx" } })).status()).toBe(400);
  expect(
    (
      await request.post("/api/locale", {
        data: { locale: "tg" },
        headers: { origin: "https://attacker.invalid" },
      })
    ).status(),
  ).toBe(403);
});
test("home internal links resolve", async ({ page, request }) => {
  await page.goto("/");
  const hrefs = await page
    .locator("a[href]")
    .evaluateAll((nodes) =>
      [
        ...new Set(
          nodes
            .map((n) => n.getAttribute("href")!)
            .filter((h) => h.startsWith("/") && !h.startsWith("//")),
        ),
      ].slice(0, 35),
    );
  for (const href of hrefs) {
    const response = await request.get(href);
    expect(response.status(), href).toBeLessThan(400);
  }
});
test("mobile and desktop home visual baseline", async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(".store-hero")).toBeVisible();
    await page
      .locator(".site-header")
      .evaluate((el) => el.setAttribute("style", "position:relative"));
    await expect(page).toHaveScreenshot(`home-${width}.png`, {
      animations: "disabled",
      fullPage: false,
      mask: [page.locator(".home-products-section"), page.locator(".cart-counter")],
    });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
});
test("Tajik mobile hero keeps compact action labels", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Ба забони тоҷикӣ", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "tg");
  await expect(page.getByRole("link", { name: "Гирифтани КП", exact: true }).first()).toBeVisible();
  await expect(page).toHaveScreenshot("home-tg-390.png", {
    animations: "disabled",
    mask: [page.locator(".home-products-section"), page.locator(".cart-counter")],
  });
  const height = await page
    .locator(".hero-banner-actions")
    .evaluate((el) => el.getBoundingClientRect().height);
  expect(height).toBeLessThanOrEqual(56);
});
test("map selection, reverse address and Turnstile coexist with CSP", async ({ page }) => {
  const failures: string[] = [];
  page.on("pageerror", (e) => failures.push(e.message));
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.fulfill({
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j7l8AAAAASUVORK5CYII=",
        "base64",
      ),
    }),
  );
  await page.route("**/api/public/address/reverse?**", (r) =>
    r.fulfill({ json: { city: "Душанбе", street: "улица Рудаки, 10" } }),
  );
  await page.goto("/catalog?q=Цемент");
  await Promise.all([
    page.waitForResponse(
      (r) => r.url().endsWith("/api/public/cart/items") && r.request().method() === "POST",
    ),
    page.getByRole("button", { name: "В корзину", exact: true }).first().click(),
  ]);
  await page.goto("/checkout");
  const map = page.getByLabel("Карта выбора адреса доставки", { exact: true });
  await expect(map.locator(".leaflet-tile-loaded").first()).toBeVisible();
  await map.click({ position: { x: 130, y: 100 } });
  await expect(page.getByText("Душанбе, улица Рудаки, 10", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Указать вручную", exact: true }).click();
  await expect(page.getByLabel("Адрес доставки", { exact: true })).toHaveValue("улица Рудаки, 10");
  await page.goto("/auth/register");
  await expect
    .poll(
      () => page.evaluate(() => Boolean((window as Window & { turnstile?: unknown }).turnstile)),
      { timeout: 25000 },
    )
    .toBe(true);
  expect(failures).toEqual([]);
});

test("Tajik custom unit retains canonical form behavior", async ({ page, context }) => {
  const { token } = JSON.parse(readFileSync(".data/acceptance-session.json", "utf8"));
  await context.addCookies([
    { name: "kh_session", value: token, url: "http://localhost:24130" },
    { name: "stroysnab_locale", value: "tg", url: "http://localhost:24130" },
  ]);
  await page.goto("/catalog/request");
  await page.getByRole("combobox", { name: /Воҳид/ }).click();
  await page.getByRole("option", { name: "дигар", exact: true }).click();
  await expect(page.getByLabel("Воҳидро ворид кунед *", { exact: true })).toBeVisible();
  await page.getByLabel("Воҳидро ворид кунед *", { exact: true }).fill("рулон");
  await expect(page.locator("select")).toHaveValue("другое");
});
test("mobile menu and search work from the keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Открыть меню", exact: true });
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#mobile-site-nav")).toBeVisible();
  await page.getByRole("button", { name: "Закрыть меню", exact: true }).press("Enter");
  await expect(page.locator("#mobile-site-nav")).toHaveCount(0);
  await page.route("**/api/public/catalog/suggestions?**", (r) =>
    r.fulfill({ json: { items: [{ name: "Цемент М500", slug: "cement-bags-01" }] } }),
  );
  const search = page.getByRole("combobox", { name: "Поиск товаров", exact: true });
  await search.fill("цем");
  await expect(page.getByRole("option").first()).toBeVisible();
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/product\/cement-bags-01$/);
});

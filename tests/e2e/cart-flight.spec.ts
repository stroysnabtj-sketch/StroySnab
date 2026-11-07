import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as typeof window & { cartFlights: number }).cartFlights = 0;
    new MutationObserver((records) => {
      for (const record of records)
        for (const node of record.addedNodes) {
          if (node instanceof HTMLElement && node.hasAttribute("data-cart-flight")) {
            (window as typeof window & { cartFlights: number }).cartFlights++;
          }
        }
    }).observe(document, { subtree: true, childList: true });
  });
  await page.goto("/catalog");
  await expect(page.locator(".product-card").first()).toBeVisible();
});

test("successful add flies a copy and keeps the original card", async ({ page }) => {
  let posts = 0;
  await page.route("**/api/public/cart/items", async (route) => {
    posts++;
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  const button = page
    .locator(".product-card")
    .getByRole("button", { name: "В корзину", exact: true })
    .first();
  const card = button.locator("xpath=ancestor::article");
  const title = await card.locator("h3").textContent();
  await button.click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as typeof window & { cartFlights: number }).cartFlights),
    )
    .toBe(1);
  await expect(page.locator("[data-cart-flight]")).toHaveCount(1);
  await expect(
    page
      .locator("main .product-card")
      .filter({ has: page.locator("h3", { hasText: title! }) })
      .first(),
  ).toBeVisible();
  await expect(page.locator("[data-cart-flight]")).toHaveCount(0);
  expect(posts).toBe(1);
});

test("failed add produces no flight", async ({ page }) => {
  await page.route("**/api/public/cart/items", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: { message: "Ошибка проверки" } }),
    }),
  );
  await page
    .locator(".product-card")
    .getByRole("button", { name: "В корзину", exact: true })
    .first()
    .click();
  await expect(page.getByRole("status").filter({ hasText: "Ошибка проверки" })).toBeVisible();
  expect(
    await page.evaluate(() => (window as typeof window & { cartFlights: number }).cartFlights),
  ).toBe(0);
});

test("rapid different cards create one mutation and one independent flight per card", async ({
  page,
}) => {
  let posts = 0;
  await page.route("**/api/public/cart/items", async (route) => {
    posts++;
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  const buttons = page
    .locator(".product-card")
    .getByRole("button", { name: "В корзину", exact: true });
  await buttons.nth(0).click();
  await buttons.nth(1).click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as typeof window & { cartFlights: number }).cartFlights),
    )
    .toBe(2);
  await expect(page.locator("[data-cart-flight]")).toHaveCount(0);
  expect(posts).toBe(2);
});

test("reduced motion skips the copy while the cart request succeeds", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  let posts = 0;
  await page.route("**/api/public/cart/items", async (route) => {
    posts++;
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page
    .locator(".product-card")
    .getByRole("button", { name: "В корзину", exact: true })
    .first()
    .click();
  await expect(page.getByRole("status").filter({ hasText: "Товар добавлен" })).toBeVisible();
  expect(posts).toBe(1);
  expect(
    await page.evaluate(() => (window as typeof window & { cartFlights: number }).cartFlights),
  ).toBe(0);
});

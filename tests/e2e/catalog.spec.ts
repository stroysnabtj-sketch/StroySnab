import { expect, test } from "@playwright/test";

test("catalog search, product offers and guest cart form a working purchase path", async ({
  page,
}) => {
  await page.goto("/catalog");
  await expect(page.locator(".category-photo-card").first()).toBeVisible();
  await page.goto("/catalog?q=цемнт&inStock=1");
  await expect(page.locator(".product-card").first()).toContainText("Цемент");
  await page.locator(".product-card h3").first().click();
  await expect(page.locator(".product-info-title")).toContainText("Цемент");
  await expect(page.locator(".product-buy")).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.locator(".product-buy").getByRole("button", { name: "В корзину" }).click();
  await expect(page.getByRole("link", { name: "Перейти в корзину" })).toBeVisible();
  await page.goto("/cart");
  await expect(page.locator(".cart-item")).toHaveCount(1);
  await expect(page.locator(".cart-total")).toContainText("TJS");
  await page
    .locator(".quantity")
    .getByRole("button", { name: /Увеличить/ })
    .click();
  await expect(page.locator(".quantity input")).toHaveValue(/\d+(?:\.\d+)?/);
});

test("catalog filters and mobile layout remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/catalog?inStock=1&sort=price_asc");
  await expect(page.locator(".product-card").first()).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
  await page.goto("/product/does-not-exist");
  await expect(page.getByText("404")).toBeVisible();
});

test("content manager can open and save a catalog product", async ({ page }) => {
  await page.request.post("/api/auth/login", {
    data: { identifier: "admin@stroyhub.tj", password: "Admin123!" },
  });
  await page.goto("/admin/catalog");
  await expect(page).toHaveURL(/\/admin\/catalog/);
  const firstRow = page.locator("tbody tr").first();
  await expect(firstRow).toBeVisible();
  const sku = (await firstRow.innerText()).match(/[A-Z][A-Z0-9-]{3,}/)?.[0];
  expect(sku).toBeTruthy();
  await page.getByLabel("Поиск товаров").fill(sku!);
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "Изменить" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Сохранить товар" }).click();
  await expect(page.getByText("Товар сохранён")).toBeVisible();
});

test("guest can submit a prefilled product request", async ({ page }) => {
  await page.goto("/catalog/request?product=Редкий%20материал");
  await expect(page.getByLabel("Название товара *")).toHaveValue("Редкий материал");
  await page.getByLabel("Контактное имя *").fill("E2E Гость");
  await page.getByLabel("Телефон *").fill("935551122");
  await page.getByRole("button", { name: "Отправить заявку" }).click();
  await expect(page.getByText("Заявка принята")).toBeVisible();
  await expect(page.locator(".request-success h2")).toContainText("PRQ-");
});

test("mobile catalog exposes products promptly and restores focus after filters", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/catalog?inStock=1");
  await page.waitForLoadState("networkidle");
  const first = page.locator(".product-card").first();
  await expect(first).toBeVisible();
  expect(
    await first.evaluate((element) => element.getBoundingClientRect().top + scrollY),
  ).toBeLessThan(1000);
  const trigger = page.getByRole("button", { name: /^Фильтры/ });
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Фильтры" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Фильтры" })).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
test("catalog add-to-cart recovers from a network failure", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/catalog?inStock=1");
  await page.waitForLoadState("networkidle");
  const add = page
    .locator(".product-card")
    .first()
    .getByRole("button", { name: "В корзину", exact: true });
  await page.route("**/api/public/cart/items", (route) => route.abort("internetdisconnected"));
  await add.click();
  await expect(
    page.getByText("Нет связи с сервером. Проверьте подключение и повторите попытку."),
  ).toBeVisible();
  await expect(add).toBeEnabled();
  await page.unroute("**/api/public/cart/items");
  await add.click();
  await expect(page.getByText("Товар добавлен в корзину", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

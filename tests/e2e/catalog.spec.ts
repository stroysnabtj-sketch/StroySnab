import { expect, test } from "@playwright/test";

test("catalog search, product offers and guest cart form a working purchase path", async ({ page }) => {
  await page.goto("/catalog");
  await expect(page.locator(".product-card")).toHaveCount(24);
  await page.locator(".catalog-filters input[name=q]").fill("цемнт");
  await page.getByRole("button", { name: "Показать товары" }).click();
  await expect(page.locator(".product-card").first()).toContainText("Цемент");
  await page.locator(".product-card h3").first().click();
  await expect(page.locator(".product-info h1")).toContainText("Цемент");
  await expect(page.locator(".offer-row")).not.toHaveCount(0);
  await page.waitForLoadState("networkidle");
  await page.locator(".product-buy").getByRole("button", { name: "В корзину" }).click();
  await expect(page.getByText("Товар добавлен в корзину")).toBeVisible();
  await page.goto("/cart");
  await expect(page.locator(".cart-item")).toHaveCount(1);
  await expect(page.locator(".cart-total")).toContainText("TJS");
  await page.locator(".quantity").getByRole("button", { name: /Увеличить/ }).click();
  await expect(page.locator(".quantity input")).toHaveValue("2.000");
});

test("catalog filters and mobile layout remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/catalog?inStock=1&sort=price_asc");
  await expect(page.locator(".product-card").first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await page.goto("/product/does-not-exist");
  await expect(page.getByText("404")).toBeVisible();
});

test("content manager can open and save a catalog product", async ({ page }) => {
  await page.goto("/auth/login?next=/admin/catalog");
  await page.getByRole("button", { name: "Администратор" }).click();
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/catalog/);
  await page.getByLabel("Поиск товаров").fill("KH-00001");
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

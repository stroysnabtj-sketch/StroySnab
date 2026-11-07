import { test, expect, type BrowserContext } from "@playwright/test";
let cookies: Parameters<BrowserContext["addCookies"]>[0] = [];
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const response = await context.request.post("/api/auth/login", {
    data: { identifier: "admin@stroyhub.tj", password: "Admin123!" },
  });
  expect(response.ok()).toBeTruthy();
  cookies = (await context.storageState()).cookies;
  await context.close();
});
test.beforeEach(async ({ context }) => {
  await context.addCookies(cookies);
});

test("guest order management redirects to login", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/auth\/login\?next=/);
});

test("admin navigation and mobile dialog preserve keyboard focus", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/admin/users");
  await page.waitForLoadState("networkidle");
  const trigger = page.getByRole("button", { name: "Открыть меню управления" });
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Меню управления" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await page.getByRole("button", { name: "Создать сотрудника", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Создать сотрудника", exact: true });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Создать сотрудника", exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("employee creation persists name and displays localized role", async ({ page }) => {
  await page.goto("/admin/users");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Создать сотрудника", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Создать сотрудника", exact: true });
  const suffix = String(Date.now()).slice(-7);
  await dialog.getByLabel("Имя и фамилия").fill("Анвар Проверка");
  await dialog.getByLabel("Телефон", { exact: true }).fill(`92${suffix}`);
  await dialog.getByLabel("E-mail", { exact: true }).fill(`audit-${suffix}@example.com`);
  await dialog.getByLabel("Временный пароль").fill("EmployeePassword123!");
  await dialog.getByLabel("Роль", { exact: true }).selectOption("CONTENT_MANAGER");
  await dialog.getByRole("button", { name: "Создать сотрудника", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByLabel("Поиск пользователей").fill(`audit-${suffix}@example.com`);
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody tr")).toContainText("Анвар Проверка");
  await expect(
    page.getByRole("combobox", { name: new RegExp(`Роль \\+99292${suffix}`) }),
  ).toHaveValue("CONTENT_MANAGER");
});

test("catalog edits preserve category profiles and modal closes with Escape", async ({ page }) => {
  await page.goto("/admin/catalog");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("tbody tr").first()).toBeVisible();
  await page.getByRole("button", { name: "Добавить товар", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Новый товар", exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Найти категорию", { exact: true }).fill("Кирпич");
  await dialog
    .getByLabel("Категория", { exact: true })
    .selectOption({ label: "Стройматериалы / Общестроительные материалы / Кирпич" });
  await expect(dialog.getByLabel("Материал кирпича", { exact: false })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("offer network errors restore the save action and remain visible", async ({ page }) => {
  await page.goto("/admin/offers");
  await page.waitForLoadState("networkidle");
  const row = page.locator("tbody tr").first();
  const input = row.getByRole("textbox").first();
  await input.fill("123.45");
  await page.route("**/api/admin/offers/*", (route) =>
    route.request().method() === "PATCH" ? route.abort("failed") : route.continue(),
  );
  await row.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(row.getByRole("alert")).toBeVisible();
  await expect(row.getByRole("button", { name: "Сохранить", exact: true })).toBeEnabled();
});

test("cross-origin supplier edits are rejected", async ({ page }) => {
  const response = await page.request.get("/api/admin/suppliers");
  const first = (await response.json()).items[0];
  const rejected = await page.request.patch(`/api/admin/suppliers/${first.id}`, {
    headers: { origin: "https://untrusted.example" },
    data: { status: "SUSPENDED" },
  });
  expect(rejected.status()).toBe(403);
  const after = (await (await page.request.get("/api/admin/suppliers")).json()).items.find(
    (shop: { id: string }) => shop.id === first.id,
  );
  expect(after.status).toBe(first.status);
});

test("delivery assignment is saved and visible to the owning guest", async ({
  page,
  browser,
  baseURL,
}) => {
  const base = new URL(baseURL!).origin;
  const guest = await browser.newContext();
  try {
    const offers = (await (await page.request.get("/api/admin/offers")).json()).items;
    const offer = offers.find(
      (row: { sku: string; stockQty: string; reservedQty: string }) =>
        row.sku === "KH-00007" && Number(row.stockQty) - Number(row.reservedQty) > 2,
    );
    expect(offer).toBeTruthy();
    expect(
      (
        await guest.request.post(`${base}/api/public/cart/items`, {
          data: { offerId: offer.id, qty: "1" },
        })
      ).ok(),
    ).toBeTruthy();
    const quote = await (
      await guest.request.post(`${base}/api/public/orders/quote`, {
        data: { fulfillment: "DELIVERY" },
      })
    ).json();
    const created = await guest.request.post(`${base}/api/public/orders`, {
      data: {
        idempotencyKey: crypto.randomUUID(),
        expectedTotalDirams: quote.totalDirams,
        customerName: "Проверка логистики",
        customerPhone: "+992931234567",
        deliveryCity: "Душанбе",
        deliveryAddress: "Улица Рудаки 10",
        fulfillment: "DELIVERY",
        paymentMethod: "CASH_ON_DELIVERY",
        vehicleType: "GAZELLE",
      },
    });
    expect(created.ok()).toBeTruthy();
    const order = await created.json();
    expect(
      (
        await page.request.patch(`/api/admin/orders/${order.id}/status`, {
          headers: { origin: base },
          data: { status: "CONFIRMED", expectedStatus: "NEW" },
        })
      ).ok(),
    ).toBeTruthy();
    await page.goto(`/admin/deliveries?q=${encodeURIComponent(order.orderNumber)}`);
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Назначить водителя", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Имя водителя").fill("Анвар Логист");
    await dialog.getByLabel("Телефон водителя").fill("+992931234568");
    await dialog.getByLabel("Госномер машины").fill("0123 AA 01");
    await dialog.getByRole("button", { name: "Сохранить назначение" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator("tbody")).toContainText("Анвар Логист");
    const customerPage = await guest.newPage();
    await customerPage.goto(`${base}/orders/${order.id}`);
    await expect(customerPage.getByText("Анвар Логист", { exact: false })).toBeVisible();
  } finally {
    await guest.close();
  }
});

test("shop adds stock, receives its order and prepares only its own goods", async ({
  page,
  browser,
  baseURL,
}) => {
  test.setTimeout(120000);
  const base = baseURL!;
  const seller = await browser.newContext(),
    guest = await browser.newContext(),
    foreign = await browser.newContext();
  try {
    expect(
      (
        await seller.request.post(`${base}/api/auth/login`, {
          data: { identifier: "seller@stroyhub.tj", password: "Seller123!" },
        })
      ).ok(),
    ).toBeTruthy();
    const catalog = (await (await page.request.get("/api/admin/catalog/categories")).json()).items;
    const category = catalog.find((row: { slug: string }) => row.slug === "kirpich");
    expect(category).toBeTruthy();
    const shopPage = await seller.newPage();
    await shopPage.goto(`${base}/seller/products/new`);
    await shopPage.waitForLoadState("networkidle");
    const title = `Товар магазина ${Date.now()}`;
    await shopPage.getByLabel("Название", { exact: true }).fill(title);
    await shopPage.getByLabel("Найти категорию", { exact: true }).fill("Кирпич");
    await shopPage.getByLabel("Категория", { exact: true }).selectOption(category.id);
    await shopPage.getByLabel("Цена магазина, TJS", { exact: true }).fill("100");
    await shopPage.getByLabel(/^Остаток,/).fill("5");
    const responsePromise = shopPage.waitForResponse(
      (response) =>
        response.url().endsWith("/api/seller/products") && response.request().method() === "POST",
    );
    await shopPage
      .getByRole("button", { name: "Сохранить и отправить на проверку", exact: true })
      .click();
    const response = await responsePromise;
    expect(response.status()).toBe(201);
    const created = await response.json();
    expect(
      (
        await page.request.patch(`/api/admin/catalog/products/${created.product.id}`, {
          data: { status: "PUBLISHED" },
        })
      ).ok(),
    ).toBeTruthy();
    expect(
      (
        await guest.request.post(`${base}/api/public/cart/items`, {
          data: { offerId: created.offer.id, qty: "2" },
        })
      ).ok(),
    ).toBeTruthy();
    const quote = await (
      await guest.request.post(`${base}/api/public/orders/quote`, {
        data: { fulfillment: "PICKUP" },
      })
    ).json();
    expect(quote.markupPercent).toBe(7);
    expect(quote.totalDirams).toBe("21400");
    expect(quote.items[0]).not.toHaveProperty("supplierPriceDirams");
    const orderResponse = await guest.request.post(`${base}/api/public/orders`, {
      data: {
        idempotencyKey: crypto.randomUUID(),
        expectedTotalDirams: quote.totalDirams,
        customerName: "Покупатель магазина",
        customerPhone: "+992931234567",
        deliveryCity: "Душанбе",
        deliveryAddress: "",
        fulfillment: "PICKUP",
        paymentMethod: "CASH_ON_DELIVERY",
      },
    });
    expect(orderResponse.status()).toBe(201);
    const order = await orderResponse.json();
    await shopPage.goto(`${base}/seller/orders/${order.id}`);
    await shopPage.waitForLoadState("networkidle");
    await expect(
      shopPage.getByRole("heading", { name: `Заказ ${order.orderNumber}` }),
    ).toBeVisible();
    await expect(shopPage.getByText("200,00 TJS", { exact: true }).first()).toBeVisible();
    await shopPage.getByRole("button", { name: "Принять заказ", exact: true }).click();
    await expect(
      shopPage.getByRole("button", { name: "Отметить готовым", exact: true }),
    ).toBeVisible();
    await shopPage.getByRole("button", { name: "Отметить готовым", exact: true }).click();
    await expect(shopPage.getByText("Готов к выдаче", { exact: true })).toBeVisible();
    await page.goto(`/admin/orders/${order.id}`);
    await expect(page.getByRole("heading", { name: "Магазины и комплектация" })).toBeVisible();
    await expect(page.getByText("Готов к выдаче", { exact: true })).toBeVisible();
    expect(
      (
        await foreign.request.post(`${base}/api/auth/login`, {
          data: { identifier: "seller2@stroyhub.tj", password: "Seller123!" },
        })
      ).ok(),
    ).toBeTruthy();
    expect((await foreign.request.get(`${base}/api/seller/orders/${order.id}`)).status()).toBe(404);
    await shopPage.goto(`${base}/seller/products?q=${encodeURIComponent(created.product.sku)}`);
    await expect(shopPage.getByText(/Свободно: 3/)).toBeVisible();
    await expect(shopPage.getByText(/В резерве: 2/)).toBeVisible();
  } finally {
    await seller.close();
    await guest.close();
    await foreign.close();
  }
});

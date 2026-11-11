import { expect, test } from "@playwright/test";

test("a new guest order appears only in the owning shop cabinet", async ({ browser, baseURL }) => {
  const shop = await browser.newContext({ baseURL });
  const other = await browser.newContext({ baseURL });
  const guest = await browser.newContext({ baseURL });
  try {
    for (const [context, identifier] of [
      [shop, "seller@stroyhub.tj"],
      [other, "seller2@stroyhub.tj"],
    ] as const) {
      expect(
        (
          await context.request.post("/api/auth/login", {
            data: { identifier, password: "Seller123!" },
          })
        ).ok(),
      ).toBeTruthy();
    }
    const { items } = await (await shop.request.get("/api/seller/offers")).json();
    const offer = items.find(
      (item: {
        isActive: boolean | string;
        stockQty: string;
        reservedQty: string;
        minOrderQty: string;
      }) =>
        (item.isActive === true || item.isActive === "true") &&
        Number(item.stockQty) - Number(item.reservedQty) >= Number(item.minOrderQty),
    );
    expect(offer).toBeTruthy();
    expect(
      (
        await guest.request.post("/api/public/cart/items", {
          data: { offerId: offer.id, qty: offer.minOrderQty },
        })
      ).status(),
    ).toBe(201);
    const created = await guest.request.post("/api/public/orders", {
      data: {
        idempotencyKey: crypto.randomUUID(),
        customerName: "Гость магазина",
        customerPhone: "+992931234567",
        deliveryCity: "Душанбе",
        fulfillment: "PICKUP",
        paymentMethod: "CASH_ON_DELIVERY",
      },
    });
    expect(created.status()).toBe(201);
    const { id, orderNumber } = await created.json();
    const shopPage = await shop.newPage();
    await shopPage.goto("/seller/orders");
    await expect(shopPage.getByRole("link", { name: orderNumber, exact: true })).toBeVisible();
    expect((await other.request.get(`/api/seller/orders/${id}`)).status()).toBe(404);
  } finally {
    await Promise.all([shop.close(), other.close(), guest.close()]);
  }
});

test("registration preserves checkout destination and can reveal the password", async ({
  page,
}) => {
  await page.goto("/auth/login?next=/checkout");
  await page
    .getByRole("link", { name: /Зарегистрироваться|Создать аккаунт/ })
    .last()
    .click();
  await expect(page).toHaveURL(/\/auth\/register\?next=%2Fcheckout/);
  await expect(page.locator('input[type="password"]')).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Получить код", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Получить код", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "По почте", exact: true }).click();
  await expect(page.getByLabel("E-mail", { exact: true })).toBeVisible();
});

test("saved addresses can use either a map point or manual entry", async ({ page }) => {
  const auth = await page.request.post("/api/auth/login", {
    data: { identifier: "client@example.com", password: "Client123!" },
  });
  expect(auth.ok()).toBeTruthy();
  await page.goto("/account/addresses");
  await expect(page.getByLabel("Карта выбора адреса доставки")).toBeVisible();
  await expect(page.getByLabel("Адрес доставки", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Выбрать центр карты" }).click();
  let saved = page.waitForResponse(
    (r) => r.url().endsWith("/api/account/addresses") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Сохранить адрес", exact: true }).click();
  expect((await saved).status()).toBe(200);
  await expect(page.getByText("Адрес сохранён", { exact: true })).toBeVisible();

  await page.getByRole("combobox", { name: "Сохранённые адреса" }).click();
  await page.getByRole("option", { name: "Новый адрес", exact: true }).click();
  await page.getByRole("button", { name: "Указать вручную", exact: true }).click();
  await expect(page.getByLabel("Карта выбора адреса доставки")).toHaveCount(0);
  await page.getByLabel("Город или район").fill("Душанбе");
  await page.getByLabel("Адрес доставки", { exact: true }).fill("Улица Рудаки, дом 10");
  saved = page.waitForResponse(
    (r) => r.url().endsWith("/api/account/addresses") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Сохранить адрес", exact: true }).click();
  const response = await saved;
  expect(response.status()).toBe(200);
  const { id } = await response.json();
  const addresses = await (await page.request.get("/api/account/addresses")).json();
  expect(addresses.items.find((item: { id: string }) => item.id === id)).toMatchObject({
    street: "Улица Рудаки, дом 10",
    lat: null,
    lng: null,
  });
});

test("checkout preserves vehicle choice and hides transport for pickup", async ({ page }) => {
  await page.goto("/catalog?q=цемент");
  await page.locator(".product-card").first().getByRole("link").first().click();
  await expect(page).toHaveURL(/\/product\//);
  await page
    .locator(".product-buy")
    .getByRole("button", { name: "В корзину", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Добавлено", exact: true })).toBeVisible();
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Оформление заказа" })).toBeVisible();
  await page.getByRole("radio", { name: /Самовывоз/ }).check();
  await expect(page.getByRole("heading", { name: "Выберите машину" })).toHaveCount(0);
  await page
    .getByRole("radio", { name: /Доставка/ })
    .first()
    .check();
  await expect(page.getByRole("heading", { name: "Выберите машину" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Тип машины для доставки" })).toBeVisible();
  const porter = page.getByRole("radio", { name: /Hyundai Porter/ });
  await porter.check();
  await page.getByRole("radio", { name: /Самовывоз/ }).check();
  await page
    .getByRole("radio", { name: /Доставка/ })
    .first()
    .check();
  await expect(porter).toBeChecked();
});

test("guest can order delivery with an address comment and register afterward", async ({
  page,
  browser,
}) => {
  await page.goto("/product/cement-bags-07");
  const buy = page.locator(".product-buy");
  await buy.getByRole("button", { name: "В корзину", exact: true }).click();
  await expect(buy.getByRole("button", { name: "Добавлено", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Увеличить количество", exact: true }).click();
  await expect(buy.getByRole("button", { name: "В корзину", exact: true })).toBeVisible();
  await page.goto("/checkout");
  await expect(page.getByRole("link", { name: "Создать аккаунт", exact: true })).toHaveCount(0);
  await page.getByLabel("Имя", { exact: true }).fill("Проверка доставки");
  await page.getByLabel("Телефон", { exact: true }).fill("+992931234567");
  await expect(page.getByLabel("Карта выбора адреса доставки")).toBeVisible();
  await expect(page.getByLabel("Адрес доставки", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Указать вручную" }).click();
  await expect(page.getByLabel("Адрес доставки", { exact: true })).toBeEmpty();
  const comment = "У входа в рынок, позвоните при подъезде";
  await page.getByLabel("Комментарий к адресу", { exact: true }).fill(comment);
  await page.getByRole("button", { name: "Оформить заказ", exact: true }).click();
  await expect(page).toHaveURL(/\/orders\//);
  await expect(page.getByRole("heading", { name: "Заказ принят в обработку" })).toBeVisible();
  await expect(page.getByText(comment, { exact: false })).toBeVisible();
  const orderId = new URL(page.url()).pathname.split("/").pop();
  await expect(page.getByRole("link", { name: "Создать аккаунт", exact: true })).toHaveAttribute(
    "href",
    `/auth/register?next=${encodeURIComponent(`/orders/${orderId}`)}`,
  );
  const admin = await browser.newContext();
  try {
    const base = new URL(page.url()).origin;
    const login = await admin.request.post(`${base}/api/auth/login`, {
      data: { identifier: "admin@stroyhub.tj", password: "Admin123!" },
    });
    expect(login.ok()).toBeTruthy();
    const changed = await admin.request.patch(`${base}/api/admin/orders/${orderId}/status`, {
      headers: { origin: base },
      data: { status: "CANCELLED", expectedStatus: "NEW" },
    });
    expect(changed.ok()).toBeTruthy();
    await page.getByRole("button", { name: "Обновить статус" }).click();
    await expect(page.getByRole("heading", { name: "Заказ отменён", exact: true })).toBeVisible();
    await expect(
      page.getByText("Дальнейшее выполнение остановлено.", { exact: false }),
    ).toBeVisible();
  } finally {
    await admin.close();
  }
});

test("registration from checkout keeps the guest basket and permits a customer order", async ({
  page,
}) => {
  await page.goto("/product/cement-bags-07");
  await page
    .locator(".product-buy")
    .getByRole("button", { name: "В корзину", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Добавлено", exact: true })).toBeVisible();
  await page.goto("/auth/register?next=%2Fcheckout");
  const suffix = Date.now().toString().slice(-7);
  await page.getByLabel("Имя и фамилия").fill("Покупатель из корзины");
  await page.getByLabel("Телефон", { exact: true }).fill(`93${suffix}`);
  await page.getByLabel("Пароль", { exact: true }).fill("ExamplePassword123!");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Зарегистрироваться", exact: true }).click();
  await expect(page).toHaveURL(/\/checkout/);
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Ваш заказ", exact: true })).toBeVisible();
  await page.getByRole("radio", { name: /Самовывоз/ }).check();
  await expect(page.getByRole("radio", { name: /Самовывоз/ })).toBeChecked();
  await expect(page.getByLabel("Имя", { exact: true })).toHaveValue("Покупатель из корзины");
  await page.getByRole("button", { name: "Оформить заказ", exact: true }).click();
  await expect(page).toHaveURL(/\/orders\//);
  await expect(page.getByRole("heading", { name: "Заказ принят в обработку" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Способ получения: Самовывоз" })).toBeVisible();
});

import { expect, test } from "@playwright/test";

test("registration preserves checkout destination and can reveal the password", async ({
  page,
}) => {
  await page.goto("/auth/login?next=/checkout");
  await page
    .getByRole("link", { name: /Зарегистрироваться|Создать аккаунт/ })
    .last()
    .click();
  await expect(page).toHaveURL(/\/auth\/register\?next=%2Fcheckout/);
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Получить код", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "По почте", exact: true }).click();
  await expect(page.getByLabel("E-mail", { exact: true })).toBeVisible();
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

test("guest checkout saves delivery preferences and shows real order status", async ({
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
  await page.getByRole("radio", { name: /Hyundai Porter/ }).check();
  await page.getByLabel("Имя", { exact: true }).fill("Проверка доставки");
  await page.getByLabel("Телефон", { exact: true }).fill("+992931234567");
  await page.getByLabel("Адрес доставки", { exact: true }).fill("Улица Рудаки, дом 10");
  await page.getByRole("button", { name: "Оформить заказ", exact: true }).click();
  await expect(page).toHaveURL(/\/orders\//);
  await expect(page.getByRole("heading", { name: "Заказ принят в обработку" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Hyundai Porter/ })).toBeVisible();
  const orderId = new URL(page.url()).pathname.split("/").pop();
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

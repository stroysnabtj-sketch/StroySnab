import { expect, test } from "@playwright/test";

test.describe("Product requests lifecycle and isolation", () => {
  const suffix = Date.now().toString().slice(-6);
  const testProductName = `Арматура E2E-${suffix}`;

  test("customer creates request -> manager responds -> customer sees response", async ({
    page,
  }) => {
    // 1. Login as customer
    await page.goto("/auth/login?next=/account");
    await page.getByRole("button", { name: "Покупатель" }).click();
    await page.getByRole("button", { name: "Войти", exact: true }).click();
    await expect(page.getByText("Личный кабинет")).toBeVisible();

    // 2. Customer navigates to request form and submits
    await page.goto("/catalog/request");
    await page.getByLabel("Название товара *").fill(testProductName);
    await page.getByLabel(/Описание/).fill("Длина 11.7м <script>alert('xss')</script>");
    await page.getByLabel("Количество").fill("5.5");
    await page.getByLabel("Единица").selectOption("т");

    const nameInput = page.getByLabel("Контактное имя *");
    const nameVal = await nameInput.inputValue();
    if (!nameVal) await nameInput.fill("E2E Покупатель");

    const phoneInput = page.getByLabel("Телефон *");
    const phoneVal = await phoneInput.inputValue();
    if (!phoneVal) await phoneInput.fill("921234567");

    await page.getByRole("button", { name: "Отправить заявку" }).click();

    // Verify success banner with doc number
    await expect(page.getByText("Заявка принята")).toBeVisible();
    const docNumberText = await page.locator(".request-success h2").textContent();
    expect(docNumberText).toMatch(/^PRQ-\d+/);
    const docNumber = docNumberText!.trim();

    // 3. Customer checks their account requests page
    await page.getByRole("link", { name: "Мои заявки" }).click();
    await expect(page).toHaveURL(/\/account\/requests/);
    await expect(page.getByText(testProductName)).toBeVisible();
    await expect(page.getByText(docNumber)).toBeVisible();
    await expect(
      page.locator(".card").filter({ hasText: docNumber }).getByText("Новая", { exact: true }),
    ).toBeVisible();

    // 4. Admin logs in and opens admin panel
    await page.request.post("/api/auth/login", {
      data: { identifier: "admin@stroyhub.tj", password: "Admin123!" },
    });
    await page.goto("/admin/product-requests");
    await expect(page).toHaveURL(/\/admin\/product-requests/);

    // Search for our created request
    await page.getByPlaceholder("Номер, товар, имя, телефон, e-mail").fill(docNumber);
    await page.getByRole("button", { name: "Найти" }).click();
    await expect(page.getByText(docNumber)).toBeVisible();

    // Open detail
    await page
      .locator("tbody tr")
      .filter({ hasText: docNumber })
      .getByRole("link", { name: "Открыть" })
      .click();
    await expect(page).toHaveURL(new RegExp(`/admin/product-requests/`));
    await expect(page.getByText(testProductName)).toBeVisible();

    // Verify XSS is escaped and safe
    await expect(page.locator("text=<script>alert('xss')</script>")).toBeVisible();

    // 5. Manager responds: AVAILABLE
    await page.getByLabel("Статус *").selectOption("AVAILABLE");
    await page.getByLabel(/Комментарий для покупателя/).fill("Товар в наличии на складе в Душанбе");
    await page.getByLabel(/Ориентировочная цена/).fill("1250.00");
    await page.getByLabel("Срок поставки (дней)").fill("2");
    await expect(page.getByLabel("Статус *")).toHaveValue("AVAILABLE");
    await expect(page.getByLabel(/Комментарий для покупателя/)).toHaveValue(
      "Товар в наличии на складе в Душанбе",
    );
    await expect(page.getByLabel(/Ориентировочная цена/)).toHaveValue("1250.00");
    let submittedBody: Record<string, unknown> | null = null;
    page.on("request", (request) => {
      if (request.method() === "PATCH" && request.url().includes("/api/product-requests/")) {
        submittedBody = request.postDataJSON();
      }
    });
    await page.getByRole("button", { name: "Сохранить ответ" }).click();

    await expect(page.getByText("Ответ сохранён успешно")).toBeVisible();
    expect(submittedBody).toMatchObject({
      status: "AVAILABLE",
      responseNote: "Товар в наличии на складе в Душанбе",
      estimatedPriceDirams: "125000",
      estimatedDeliveryDays: 2,
    });
    const requestId = new URL(page.url()).pathname.split("/").at(-1);
    const saved = await page.evaluate(async (id) => {
      const response = await fetch(`/api/product-requests/${id}`);
      return response.json();
    }, requestId);
    expect(saved.status).toBe("AVAILABLE");

    // 6. Switch back to Customer and verify response
    await page.goto("/auth/login?next=/account/requests");
    await page.getByRole("button", { name: "Покупатель" }).click();
    await page.getByRole("button", { name: "Войти", exact: true }).click();
    await expect(page).toHaveURL(/\/account\/requests/);

    await expect(page.getByText(docNumber)).toBeVisible();
    const ownRequest = page.locator(".card").filter({ hasText: docNumber });
    await expect(ownRequest.getByText("Доступно")).toBeVisible();
    await expect(ownRequest.getByText("Товар в наличии на складе в Душанбе")).toBeVisible();
    await expect(ownRequest.getByText(/1\s?250,00\s?TJS/)).toBeVisible();
    await expect(ownRequest.getByText("≈ 2 дн.")).toBeVisible();
  });

  test("unauthorized user cannot access admin product-requests", async ({ page }) => {
    // Guest accessing admin requests -> redirects to login
    await page.goto("/admin/product-requests");
    await expect(page).toHaveURL(/\/auth\/login/);

    // Customer accessing admin requests -> access denied or login
    await page.goto("/auth/login?next=/admin/product-requests");
    await page.getByRole("button", { name: "Покупатель" }).click();
    await page.getByRole("button", { name: "Войти", exact: true }).click();
    await expect(page).toHaveURL(/\/access-denied/);
  });
});

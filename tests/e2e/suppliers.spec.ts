import { expect, test } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test("admin calculates procurement, markup and customer price", async ({ page }) => {
  const response = await page.request.post("/api/auth/login", {
    data: { identifier: "admin@stroyhub.tj", password: "Admin123!" }
  });
  expect(response.ok()).toBe(true);
  await page.goto("/admin/pricing");
  await expect(page.getByLabel("Товар для расчёта").locator("option")).not.toHaveCount(0);
  await page.getByLabel("Закупочная цена для расчёта").fill("100.00");
  await page.getByRole("button", { name: "Рассчитать" }).click();
  await expect(page.locator(".pricing-result")).toContainText("100,00 TJS");
  await expect(page.locator(".pricing-result")).toContainText("10,00 TJS");
  await expect(page.locator(".pricing-result")).toContainText("110,00 TJS");
});

test("admin invitation creates staff membership scoped to the invited supplier", async ({ page }) => {
  const response = await page.request.post("/api/auth/login", {
    data: { identifier: "admin@stroyhub.tj", password: "Admin123!" }
  });
  expect(response.ok()).toBe(true);
  const suppliersResponse = await page.request.get("/api/admin/suppliers");
  const target = (await suppliersResponse.json()).items[0];
  await page.goto("/admin/suppliers");
  const row = page.locator("tbody tr").filter({ hasText: target.name });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Пригласить" }).click();
  const invitation = page.getByLabel("Ссылка приглашения");
  await expect(invitation).toBeVisible();
  const url = await invitation.inputValue();
  expect(url).toContain("/supplier-invite?code=");

  const suffix = Date.now().toString().slice(-7);
  const email = `e2e-invited-${suffix}@example.com`;
  await page.goto(url);
  await page.getByLabel("Телефон").fill(`936${suffix}`);
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Пароль").fill("Invited123!");
  await page.getByRole("button", { name: "Принять приглашение" }).click();
  await expect(page.getByText("Вы в команде")).toBeVisible();

  const staffLogin = await page.request.post("/api/auth/login", {
    data: { identifier: email, password: "Invited123!" }
  });
  expect(staffLogin.ok()).toBe(true);
  const offersResponse = await page.request.get("/api/seller/offers");
  expect(offersResponse.ok()).toBe(true);
  const offers = (await offersResponse.json()).items;
  expect(offers.length).toBeGreaterThan(0);
  expect(offers.every((offer: { supplierId: string }) => offer.supplierId === target.id)).toBe(true);
});

test("seller HTTP API ignores client supplier identity and rejects foreign offers", async ({ playwright }) => {
  const admin = await playwright.request.newContext({ baseURL });
  const seller = await playwright.request.newContext({ baseURL });
  try {
    const adminLogin = await admin.post("/api/auth/login", {
      data: { identifier: "admin@stroyhub.tj", password: "Admin123!" }
    });
    const sellerLogin = await seller.post("/api/auth/login", {
      data: { identifier: "seller@stroyhub.tj", password: "Seller123!" }
    });
    expect(adminLogin.ok()).toBe(true);
    expect(sellerLogin.ok()).toBe(true);

    const own = (await (await seller.get("/api/seller/offers")).json()).items;
    const all = (await (await admin.get("/api/admin/offers?supplierId=")).json()).items;
    const ownSupplierId = own[0].supplierId;
    expect(own.every((offer: { supplierId: string }) => offer.supplierId === ownSupplierId)).toBe(true);
    const foreign = all.find((offer: { supplierId: string }) => offer.supplierId !== ownSupplierId);
    expect(foreign).toBeTruthy();

    const rejected = await seller.patch(`/api/seller/offers/${foreign.id}`, {
      data: { supplierId: foreign.supplierId, stockQty: "999" }
    });
    expect(rejected.status()).toBe(404);
    const after = (await (await admin.get(`/api/admin/offers?supplierId=${foreign.supplierId}`)).json()).items;
    expect(after.find((offer: { id: string }) => offer.id === foreign.id).stockQty).toBe(foreign.stockQty);
  } finally {
    await admin.dispose();
    await seller.dispose();
  }
});

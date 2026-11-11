import { expect, test } from "@playwright/test";

test("guest request pages require an account and creation APIs reject guests", async ({ page }) => {
  await page.goto("/request");
  await expect(page).toHaveURL(/\/auth\/login\?next=%2Frequest$/);
  await page.goto("/catalog/request?product=Цемент");
  const login = new URL(page.url());
  expect(login.pathname).toBe("/auth/login");
  const destination = new URL(login.searchParams.get("next")!, login.origin);
  expect(destination.pathname).toBe("/catalog/request");
  expect(destination.searchParams.get("product")).toBe("Цемент");

  const responses = await Promise.all([
    page.request.post("/api/procurement/submit", { multipart: { payload: "{}" } }),
    page.request.post("/api/procurement", { data: {} }),
    page.request.post("/api/product-requests", { data: {} }),
  ]);
  expect(responses.map((response) => response.status())).toEqual([401, 401, 401]);
});

test("buyer receives the published PDF once and can download it again manually", async ({
  page,
  browser,
}) => {
  const buyer = await page.request.post("/api/auth/login", {
    data: { identifier: "client@example.com", password: "Client123!" },
  });
  expect(buyer.ok()).toBe(true);
  await page.goto("/request");
  await page.getByLabel("Список материалов").setInputFiles({
    name: "materials.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("name,qty,unit\nЦемент М500,20,меш.", "utf8"),
  });
  await page.getByRole("button", { name: "Отправить заявку", exact: true }).click();
  await expect(page).toHaveURL(/\/requests\/[a-f\d-]+$/);
  await expect(page.getByRole("heading", { name: "Готовим предложение" })).toBeVisible();
  await expect(page.getByRole("link", { name: "materials.csv" })).toBeVisible();
  const id = new URL(page.url()).pathname.split("/").pop();

  const manager = await browser.newContext();
  try {
    const login = await manager.request.post("/api/auth/login", {
      data: { identifier: "admin@stroyhub.tj", password: "Admin123!" },
    });
    expect(login.ok()).toBe(true);
    const save = (send: boolean, version: number) =>
      manager.request.put(`/api/procurement/${id}/quotation`, {
        data: {
          version,
          send,
          validUntil: new Date(Date.now() + 86400000).toISOString(),
          lines: [{ name: "Цемент М500", qty: "20", unit: "меш.", basePriceDirams: "6550" }],
        },
      });
    const draft = await save(false, 0);
    expect(draft.ok()).toBe(true);
    const hidden = await page.request.get(`/api/procurement/${id}/pdf`);
    expect(hidden.status()).toBe(404);
    const automatic = page.waitForEvent("download", { timeout: 35000 });
    const published = await save(true, (await draft.json()).version);
    expect(published.ok()).toBe(true);

    const download = await automatic;
    expect(download.suggestedFilename()).toMatch(/^QUO.*\.pdf$/);
    expect(await download.failure()).toBeNull();
    const duplicate = page.waitForEvent("download", { timeout: 2500 }).catch(() => null);
    await page.reload();
    await expect(page.getByRole("link", { name: "Скачать PDF" })).toBeVisible();
    expect(await duplicate).toBeNull();
    const manual = page.waitForEvent("download");
    await page.getByRole("link", { name: "Скачать PDF" }).click();
    expect((await manual).suggestedFilename()).toBe(download.suggestedFilename());
  } finally {
    await manager.close();
  }
});

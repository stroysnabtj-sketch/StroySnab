import { test, expect } from "@playwright/test";
import path from "node:path";

test("guest list import, attachment retry, manager quotation and guest acceptance", async ({
  page,
  browser,
}, testInfo) => {
  test.setTimeout(180000);
  const csv = {
    name: "materials.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("name,qty,unit\nЦемент М500,20,меш.\nАрматура 12 мм,100,м", "utf8"),
  };
  await page.goto("/request");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Название заявки").fill(`Закупка E2E ${Date.now()}`);
  await page.getByText("Вставить список или импортировать таблицу", { exact: true }).click();
  await page.getByLabel("Импорт Excel / Word / CSV").setInputFiles(csv);
  await expect(page.getByLabel("Материал 1", { exact: true })).toHaveValue("Цемент М500");
  await expect(page.getByLabel("Материал 2", { exact: true })).toHaveValue("Арматура 12 мм");
  await page.getByLabel("Приложить список или фотографии").setInputFiles(csv);
  await page.getByLabel("Имя", { exact: true }).fill("Проверка закупки");
  await page.getByLabel("Телефон", { exact: true }).fill("+992931234567");
  for (const width of [1440, 390, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => scrollTo(0, 0));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: testInfo.outputPath(`request-${width}.png`), fullPage: true });
  }
  let attempts = 0,
    creates = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && new URL(request.url()).pathname === "/api/procurement")
      creates++;
  });
  await page.route("**/api/procurement/*/attachments", async (route) => {
    if (attempts++ === 0)
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: { message: "Проверка: загрузка временно недоступна" } }),
      });
    else await route.continue();
  });
  await page.getByRole("button", { name: "Отправить заявку", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "загрузка временно недоступна" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Повторить загрузку файлов" }).click();
  await expect(page.getByRole("heading", { name: /Заявка RFQ/ })).toBeVisible();
  expect(creates).toBe(1);
  await page.getByRole("link", { name: "Открыть заявку", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Готовим предложение" })).toBeVisible();
  const guestUrl = page.url();
  const id = new URL(guestUrl).pathname.split("/").pop()!;
  const admin = await browser.newContext();
  const login = await admin.request.post("/api/auth/login", {
    data: { identifier: "admin@stroyhub.tj", password: "Admin123!" },
  });
  expect(login.ok()).toBe(true);
  const manager = await admin.newPage();
  await manager.goto(`/admin/procurement/${id}`);
  await manager.waitForLoadState("networkidle");
  await expect(manager.getByRole("heading", { name: "Подготовить КП" })).toBeVisible();
  await manager.getByLabel("Цена, сомони", { exact: true }).nth(0).fill("65.50");
  await manager.getByLabel("Цена, сомони", { exact: true }).nth(1).fill("12.25");
  await manager.getByLabel("Доставка, сомони", { exact: true }).fill("150");
  await manager
    .getByLabel("Условия и сроки поставки")
    .fill("Доставка на объект в течение 3 дней. Разгрузка силами покупателя.");
  for (const width of [1440, 390, 360]) {
    await manager.setViewportSize({ width, height: 900 });
    await manager.evaluate(() => scrollTo(0, 0));
    expect(await manager.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await manager.screenshot({
      path: testInfo.outputPath(`quotation-editor-${width}.png`),
      fullPage: true,
    });
  }
  await manager.getByRole("button", { name: "Отправить КП покупателю" }).click();
  await expect(
    manager.getByRole("heading", { name: /Коммерческое предложение QUO/ }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Принять КП и создать заказ" })).toBeVisible();
  await expect(page.getByRole("link", { name: "materials.csv" })).toBeVisible();
  const pdfUrl = await page.getByRole("link", { name: "Скачать PDF" }).getAttribute("href");
  const pdf = await page.request.get(pdfUrl!);
  expect(pdf.ok()).toBe(true);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
  await testInfo.attach("quotation.pdf", {
    body: await pdf.body(),
    contentType: "application/pdf",
  });
  for (const width of [1440, 390, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => scrollTo(0, 0));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: testInfo.outputPath(`buyer-quotation-${width}.png`),
      fullPage: true,
    });
  }
  await page.getByLabel("Адрес доставки", { exact: true }).fill("Душанбе, улица Рудаки, дом 10");
  await page.getByRole("button", { name: "Принять КП и создать заказ" }).click();
  await expect(page.getByText("Предложение принято. Заказ создан.", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Открыть заказ" }).click();
  await expect(page).toHaveURL(/\/orders\//);
  await expect(page.getByText("This page could not be found.")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /Заказ № ORD/ })).toBeVisible();
  await expect(page.getByText(/Получатель: Проверка закупки/)).toBeVisible();
  await admin.close();
  console.log(
    `Procurement screenshots: ${path.dirname(testInfo.outputPath("buyer-quotation-360.png"))}`,
  );
});

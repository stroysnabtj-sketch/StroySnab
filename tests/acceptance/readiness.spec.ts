import { readFileSync } from "node:fs";
import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const adminPaths = [
  "/admin",
  "/admin/catalog",
  "/admin/categories",
  "/admin/suppliers",
  "/admin/offers",
  "/admin/pricing",
  "/admin/orders",
  "/admin/deliveries",
  "/admin/procurement",
  "/admin/product-requests",
  "/admin/users",
  "/admin/audit",
  "/admin/notifications",
  "/admin/home-collections",
];
const customerPaths = [
  "/account",
  "/account/orders",
  "/account/requests",
  "/account/addresses",
  "/account/profile",
  "/request",
  "/catalog/request",
];
function fixture() {
  return JSON.parse(readFileSync(".data/acceptance-session.json", "utf8")) as {
    token: string;
    staffToken: string;
    orderId: string;
    requestId: string;
  };
}
async function login(context: BrowserContext, role: "customer" | "admin") {
  const f = fixture();
  await context.addCookies([
    {
      name: "kh_session",
      value: role === "admin" ? f.staffToken : f.token,
      url: "http://localhost:24130",
    },
  ]);
}
async function settled(page: Page) {
  await expect(page.getByText("Загружаем данные…", { exact: false })).toHaveCount(0);
  await expect(
    page.getByRole("alert").filter({ hasText: "Не удалось загрузить данные" }),
  ).toHaveCount(0);
}
for (const role of ["customer", "admin"] as const) {
  test(`@roles ${role}: every implemented workspace route, mobile layout and accessibility`, async ({
    page,
    context,
  }, testInfo) => {
    test.setTimeout(180000);
    await login(context, role);
    const f = fixture();
    const paths =
      role === "admin"
        ? [...adminPaths, `/admin/orders/${f.orderId}`, `/admin/procurement/${f.requestId}`]
        : [...customerPaths, `/orders/${f.orderId}`, `/requests/${f.requestId}`];
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const findings: unknown[] = [];
    for (const path of paths) {
      await page.setViewportSize({ width: 1440, height: 900 });
      const r = await page.goto(path);
      expect(r?.status(), path).toBe(200);
      expect(page.url(), path).not.toContain("/auth/");
      await expect(page.locator("h1"), path).toHaveCount(1);
      await settled(page);
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      for (const v of axe.violations.filter((v) =>
        ["critical", "serious"].includes(v.impact || ""),
      ))
        findings.push({
          path,
          id: v.id,
          nodes: v.nodes.map((n) => ({
            html: n.html,
            target: n.target,
            summary: n.failureSummary,
          })),
        });
      await page.setViewportSize({ width: 390, height: 900 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        path,
      ).toBe(true);
    }
    await testInfo.attach(`${role}-accessibility.json`, {
      body: JSON.stringify(findings, null, 2),
      contentType: "application/json",
    });
    expect(errors).toEqual([]);
    expect(findings).toEqual([]);
  });
}
test("@links workspace links resolve for customer and administrator", async ({ page, context }) => {
  test.setTimeout(120000);
  for (const role of ["customer", "admin"] as const) {
    await login(context, role);
    const paths = role === "admin" ? adminPaths : customerPaths;
    const links = new Set<string>();
    for (const path of paths) {
      await page.goto(path);
      await settled(page);
      const hrefs = await page
        .locator("a[href]")
        .evaluateAll((nodes) =>
          nodes
            .map((n) => n.getAttribute("href")!)
            .filter(
              (h) =>
                h.startsWith("/") &&
                !h.startsWith("//") &&
                !h.startsWith("/api/") &&
                !h.includes("/pdf"),
            ),
        );
      hrefs.forEach((h) => links.add(h));
    }
    for (const href of links) {
      const r = await context.request.get(href);
      expect(r.status(), `${role} ${href}`).toBeLessThan(400);
    }
  }
});
test("@roles guests and customers cannot open admin pages or APIs", async ({ context, page }) => {
  for (const path of adminPaths) {
    await page.goto(path);
    expect(page.url()).toContain("/auth/login");
  }
  await login(context, "customer");
  for (const path of adminPaths) {
    await page.goto(path);
    expect(page.url()).toContain("/access-denied");
  }
  for (const path of [
    "/api/admin/users",
    "/api/admin/pricing/history",
    "/api/admin/catalog/products",
    "/api/admin/suppliers",
  ]) {
    expect((await context.request.get(path)).status(), path).toBe(403);
  }
});
const visualScreens = [
  ["catalog", "/catalog", 1440, "guest"],
  ["product", "/product/cement-bags-01", 390, "guest"],
  ["registration", "/auth/register", 390, "guest"],
  ["account", "/account", 1440, "customer"],
  ["profile", "/account/profile", 390, "customer"],
  ["requests", "/account/requests", 1440, "customer"],
  ["addresses", "/account/addresses", 390, "customer"],
  ...[
    "overview",
    "catalog",
    "orders",
    "procurement",
    "categories",
    "pricing",
    "deliveries",
    "home-collections",
    "users",
  ].map((name) => [
    "admin-" + name,
    name === "overview" ? "/admin" : "/admin/" + name,
    1440,
    "admin",
  ]),
] as Array<[string, string, number, "guest" | "customer" | "admin"]>;
for (const [name, path, width, role] of visualScreens)
  test(`@visual ${name}`, async ({ page, context }) => {
    if (role !== "guest") await login(context, role);
    await page.setViewportSize({ width, height: 900 });
    await page.route("https://tile.openstreetmap.org/**", (r) =>
      r.fulfill({
        contentType: "image/png",
        body: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j7l8AAAAASUVORK5CYII=",
          "base64",
        ),
      }),
    );
    await page.route("https://challenges.cloudflare.com/**", (r) => r.abort());
    await page.goto(path);
    await settled(page);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${name}-${width}.png`, {
      animations: "disabled",
      mask: [page.getByText(/\d{2}\.\d{2}\.\d{4}/), page.locator(".leaflet-control-attribution")],
    });
  });
test("@checkout cash order reaches admin and a status change reaches its customer", async ({
  page,
  context,
  browser,
}) => {
  await login(context, "customer");
  await page.goto("/catalog?q=Цемент");
  await Promise.all([
    page.waitForResponse(
      (r) => r.url().endsWith("/api/public/cart/items") && r.request().method() === "POST",
    ),
    page.getByRole("button", { name: "В корзину", exact: true }).first().click(),
  ]);
  await page.goto("/checkout");
  await expect(page.getByText("Наличными при получении", { exact: true })).toBeVisible();
  await expect(page.getByText("По счёту", { exact: true })).toHaveCount(0);
  await page.getByRole("radio", { name: /Самовывоз/ }).check();
  await page.getByLabel("Имя", { exact: true }).fill("Демонстрационный покупатель");
  await page.getByLabel("Телефон", { exact: true }).fill("+992900000000");
  const sent = page.waitForResponse(
    (r) => r.url().endsWith("/api/public/orders") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Оформить заказ", exact: true }).click();
  const response = await sent;
  expect(response.status()).toBe(201);
  const { id } = await response.json();
  await expect(page).toHaveURL(new RegExp(`/orders/${id}$`));
  const admin = await browser.newContext();
  await login(admin, "admin");
  const adminPage = await admin.newPage();
  await adminPage.goto(`/admin/orders/${id}`);
  await adminPage.getByRole("combobox", { name: "Новый статус заказа", exact: true }).click();
  await adminPage.getByRole("option", { name: "Подтверждён", exact: true }).click();
  await Promise.all([
    adminPage.waitForResponse(
      (r) => r.url().endsWith(`/orders/${id}/status`) && r.request().method() === "PATCH",
    ),
    adminPage.getByRole("button", { name: "Применить", exact: true }).click(),
  ]);
  await page.reload();
  await expect(page.getByText("Подтверждён", { exact: true }).first()).toBeVisible();
  const pdf = await context.request.get(`/orders/${id}/pdf`);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
  await admin.close();
});

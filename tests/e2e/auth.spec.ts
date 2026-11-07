import { expect, test } from "@playwright/test";

test("terms are public and contain eight anchored sections", async ({ page }) => {
  await page.goto("/terms");
  await expect(
    page.getByRole("heading", { name: "Пользовательское соглашение", exact: true }),
  ).toBeVisible();
  await expect(page.locator("article h2")).toHaveCount(8);
  await expect(page.locator("#s8")).toBeVisible();
});

test("registration requires terms before requesting a contact code", async ({ page }) => {
  const suffix = Date.now().toString().slice(-7);
  await page.goto("/auth/register");
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await page.getByLabel("Имя и фамилия").fill("E2E Покупатель");
  await page.getByLabel("Телефон", { exact: true }).fill(`93${suffix}`);
  await page.getByRole("button", { name: "Получить код", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("Примите условия");
  await expect(
    page.getByRole("link", { name: "политику конфиденциальности", exact: true }),
  ).toHaveAttribute("href", "/privacy");
});

test("login offers SMS and email without authenticator keys", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page.getByLabel("Телефон", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "По почте", exact: true }).click();
  await expect(page.getByLabel("E-mail", { exact: true })).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(page.getByText(/резервн|аутентификатор/i)).toHaveCount(0);
  await expect(page.getByText("Вход сохраняется на 30 дней.", { exact: true })).toHaveCount(0);
});

test("guest cannot enter admin", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/auth\/login/);
});

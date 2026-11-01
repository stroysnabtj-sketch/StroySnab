import { expect, test } from "@playwright/test";

test("terms are public and contain eight anchored sections", async ({ page }) => {
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "Пользовательское соглашение", exact: true })).toBeVisible();
  await expect(page.locator("article h2")).toHaveCount(8);
  await expect(page.locator("#s8")).toBeVisible();
});

test("registration requires terms and succeeds with acceptance", async ({ page }) => {
  const suffix = Date.now().toString().slice(-7);
  await page.goto("/auth/register");
  await page.getByLabel("Имя и фамилия").fill("E2E Покупатель");
  await page.getByLabel("Телефон", { exact: true }).fill(`93${suffix}`);
  await page.getByLabel("E-mail (необязательно)").fill(`e2e${suffix}@example.com`);
  await page.getByLabel(/Пароль/).fill("E2ePassword123!");
  await page.getByRole("button", { name: "Зарегистрироваться" }).click();
  await expect(page.getByText("Необходимо принять условия соглашения")).toBeVisible();
  await page.getByRole("checkbox").check();
  await expect(page.getByRole("link", { name: "пользовательского соглашения" })).toHaveAttribute("target", "_blank");
  await page.getByRole("button", { name: "Зарегистрироваться" }).click();
  await expect(page).toHaveURL(/\/account/);
  await expect(page.getByText("E2E Покупатель")).toBeVisible();
});

test("admin login and logout work", async ({ page }) => {
  await page.goto("/auth/login?next=/admin");
  await page.getByRole("button", { name: "Администратор" }).click();
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByRole("heading", { name: "Обзор платформы" })).toBeVisible();
});

test("guest cannot enter admin", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/auth\/login/);
});

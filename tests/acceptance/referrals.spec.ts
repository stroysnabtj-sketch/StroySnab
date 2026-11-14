import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const fixture = () => JSON.parse(readFileSync(".data/acceptance-session.json", "utf8"));
test("referral redirect preserves normalized code privately and rejects malformed input", async ({
  context,
  page,
  request,
}) => {
  const r = await request.get("/r/ab12cd34", { maxRedirects: 0 });
  expect(r.status()).toBe(307);
  expect(r.headers().location).toBe("/auth/register?ref=AB12CD34");
  expect(r.headers()["x-robots-tag"]).toContain("noindex");
  expect(r.headers()["cache-control"]).toContain("no-store");
  const invalid = await request.get("/r/not-a-code", { maxRedirects: 0 });
  expect(invalid.headers().location).toBe("/auth/register");
  await page.goto("/r/ab12cd34");
  const cookie = (await context.cookies()).find((c) => c.name === "stroysnab_ref");
  expect(cookie).toMatchObject({ value: "AB12CD34", httpOnly: true, sameSite: "Lax" });
});
test("referral API and page are private, stats and copy work on mobile", async ({
  page,
  context,
}) => {
  expect((await context.request.get("/api/account/referral")).status()).toBe(401);
  await page.goto("/account/referral");
  await expect(page).toHaveURL(/\/auth\/login/);
  await context.addCookies([
    { name: "kh_session", value: fixture().staffToken, url: "http://localhost:24130" },
  ]);
  expect((await context.request.get("/api/account/referral")).status()).toBe(403);
  await context.addCookies([
    { name: "kh_session", value: fixture().token, url: "http://localhost:24130" },
  ]);
  const r = await context.request.get("/api/account/referral");
  expect(r.status()).toBe(200);
  expect(r.headers()["cache-control"]).toContain("no-store");
  const data = await r.json();
  expect(data.code).toMatch(/^[A-F0-9]{8}$/);
  expect(data.stats).toEqual({ invited: 0, pending: 0, credited: 0 });
  await page.setViewportSize({ width: 390, height: 900 });
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/account/referral");
  await expect(page.getByRole("heading", { name: "Приглашайте друзей и коллег" })).toBeVisible();
  await page.getByRole("button", { name: "Скопировать ссылку", exact: true }).click();
  await expect(page.getByRole("button", { name: "Скопировано", exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(data.link);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(axe.violations.filter((v) => ["serious", "critical"].includes(v.impact || ""))).toEqual(
    [],
  );
  const redirect = await context.request.get("/r/AB12CD34", { maxRedirects: 0 });
  expect(redirect.headers().location).toBe("/account/referral");
});

import { test } from "node:test";
import assert from "node:assert/strict";

const guardPath = new URL("./demo-guard.mjs", import.meta.url);
const safeEnv = {
  DEMO_MODE: "isolated-local",
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://demo:demo-local-only@demo-db:5432/stroysnab_demo",
  APP_URL: "http://localhost:3000",
  SITE_URL: "http://localhost:3000",
  STORAGE_DRIVER: "local",
  STORAGE_DIR: "/app/.data/storage",
  AUTH_PASSWORD_LOGIN_DISABLED: "false",
  STAFF_EMAIL_OTP_REQUIRED: "false",
  AUTH_SMS_PROVIDER: "disabled",
  AUTH_EMAIL_PROVIDER: "disabled",
  NOTIFICATIONS_SMS_ENABLED: "false",
  NOTIFICATIONS_EMAIL_ENABLED: "false",
  AI_QUOTATION_ENABLED: "false",
};

async function check(env) {
  const { assertDemoEnvironment } = await import(guardPath.href);
  return assertDemoEnvironment(env);
}

test("demo guard accepts the isolated local production configuration", async () => {
  await assert.doesNotReject(() => check(safeEnv));
});

test("demo guard refuses remote, production and ambiguous database URLs before startup", async () => {
  for (const database of [
    undefined,
    "",
    "postgresql://demo:demo-local-only@prod:5432/stroysnab_demo",
    "postgresql://demo:demo-local-only@demo-db:5432/production",
    `${safeEnv.DATABASE_URL}?host=production.example`,
    "postgresql://postgres:postgres@localhost:5432/kushoniyon",
  ]) {
    await assert.rejects(() => check({ ...safeEnv, DATABASE_URL: database }), /demo/i);
  }
});

test("demo guard rejects accidental external credentials and enabled transports", async () => {
  for (const patch of [
    { DEMO_MODE: "" },
    { NODE_ENV: "development" },
    { APP_URL: "https://production.example" },
    { SITE_URL: "https://production.example" },
    { STORAGE_DRIVER: "s3" },
    { STORAGE_DIR: "/data/production" },
    { AUTH_SMS_PROVIDER: "payom" },
    { AUTH_EMAIL_PROVIDER: "resend" },
    { AUTH_SMS_SEND_TOKEN: "production-key" },
    { AUTH_EMAIL_SEND_URL: "https://mail.example" },
    { NOTIFICATIONS_RESEND_API_KEY: "key" },
    { NOTIFICATIONS_SMS_ENABLED: "true" },
    { NOTIFICATIONS_EMAIL_ENABLED: "true" },
    { AI_QUOTATION_ENABLED: "true" },
    { DEEPSEEK_API_KEY: "key" },
    { S3_ACCESS_KEY_ID: "key" },
    { TURNSTILE_SECRET_KEY: "key" },
  ]) {
    await assert.rejects(() => check({ ...safeEnv, ...patch }), /demo/i);
  }
});

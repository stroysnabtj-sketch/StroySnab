import { spawn } from "node:child_process";
import path from "node:path";
import { mkdirSync, mkdtempSync } from "node:fs";
mkdirSync(".data", { recursive: true });
const env = {
  ...process.env,
  DATABASE_URL: "",
  PGLITE_DATA_DIR: mkdtempSync(path.resolve(".data/acceptance-db-")),
  AUTH_EMAIL_PROVIDER: "disabled",
  AUTH_SMS_PROVIDER: "disabled",
  NOTIFICATIONS_EMAIL_ENABLED: "false",
  NOTIFICATIONS_SMS_ENABLED: "false",
  AI_QUOTATION_ENABLED: "false",
  TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
  STAFF_EMAIL_OTP_REQUIRED: "true",
};
const seed = spawn(process.execPath, ["--import", "tsx", "scripts/acceptance-seed.ts"], {
  env,
  stdio: "inherit",
});
let server;
seed.on("exit", (code) => {
  if (code !== 0) {
    process.exitCode = code || 1;
    return;
  }
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "24130"], {
    env,
    stdio: "inherit",
  });
  server.on("exit", (code) => {
    process.exitCode = code || 0;
  });
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    seed.kill();
    server?.kill();
    process.exit(0);
  });

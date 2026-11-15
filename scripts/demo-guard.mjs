/** Demo-only executable boundary. Never import this into the production application. */
export function assertDemoEnvironment(env = process.env) {
  const expected = {
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
  for (const [name, value] of Object.entries(expected)) {
    if (env[name] !== value) throw new Error(`Demo startup refused: invalid ${name}`);
  }
  // Fail closed if someone injects production secrets or service endpoints with an override.
  for (const [name, value] of Object.entries(env)) {
    if (
      value &&
      (/^(AUTH_(SMS|EMAIL)_SEND_|NOTIFICATIONS_.*(TOKEN|SECRET|KEY|SEND_URL)|S3_)/.test(name) ||
        [
          "DEEPSEEK_API_KEY",
          "OPENAI_API_KEY",
          "TURNSTILE_SECRET_KEY",
          "TURNSTILE_SITE_KEY",
        ].includes(name))
    ) {
      throw new Error(`Demo startup refused: external service configuration ${name}`);
    }
  }
}

import { defineRailway, project, service, preserve, github } from "railway/iac";

// This partial owns the website and its notification worker. Database and backups remain independently managed.
export const partial = "StroySnab";

export default defineRailway(() => {
  const StroySnab = service("StroySnab", {
    env: {
      APP_URL: preserve(),
      AUTH_ADMIN_PASSWORD_LOGIN: preserve(),
      AUTH_EMAIL_PROVIDER: preserve(),
      AUTH_LEGACY_PASSWORD_LOGIN: preserve(),
      AUTH_SMS_PROVIDER: preserve(),
      AUTH_SMS_SEND_URL: preserve(),
      AUTH_SMS_SENDER: preserve(),
      AUTH_SMS_TEMPLATE_ID: preserve(),
      DATABASE_URL: preserve(),
      NOTIFICATIONS_EMAIL_FROM: preserve(),
      NOTIFICATIONS_RESEND_API_KEY: preserve(),
      NOTIFICATIONS_SMS_PROVIDER: preserve(),
      NOTIFICATIONS_SMS_SEND_TOKEN: preserve(),
      NOTIFICATIONS_SMS_SEND_URL: preserve(),
      NOTIFICATIONS_SMS_SENDER: preserve(),
      ORDER_GUEST_LINK_SECRET: preserve(),
      PORT: preserve(),
      S3_ACCESS_KEY_ID: preserve(),
      S3_BUCKET: preserve(),
      S3_ENDPOINT: preserve(),
      S3_FORCE_PATH_STYLE: preserve(),
      S3_REGION: preserve(),
      S3_SECRET_ACCESS_KEY: preserve(),
      SESSION_SECRET: preserve(),
      SITE_URL: preserve(),
      STORAGE_DRIVER: preserve(),
      TRUSTED_PROXY_HEADER: preserve(),
      TURNSTILE_SECRET_KEY: preserve(),
      TURNSTILE_SITE_KEY: preserve(),
    },
    source: github("stroysnabtj-sketch/StroySnab", { branch: "main" }),
    build: { builder: "DOCKERFILE", dockerfilePath: "Dockerfile" },
    deploy: { restartPolicyType: "ON_FAILURE", restartPolicyMaxRetries: 10 },
    start: "node server.js",
    healthcheck: "/api/health",
    healthcheckTimeout: 120,
  });
  const notifications = service("StroySnab-notifications", {
    source: github("stroysnabtj-sketch/StroySnab", { branch: "main" }),
    build: { builder: "DOCKERFILE", dockerfilePath: "Dockerfile" },
    start: "node notification-worker.cjs",
    deploy: { restartPolicyType: "NEVER", cronSchedule: "*/5 * * * *" },
    env: {
      DATABASE_URL: StroySnab.env.DATABASE_URL,
      APP_URL: "https://www.stroysnab.tj",
      ORDER_GUEST_LINK_SECRET: StroySnab.env.ORDER_GUEST_LINK_SECRET,
      NOTIFICATIONS_SMS_ENABLED: "true",
      NOTIFICATIONS_SMS_PROVIDER: "payom",
      NOTIFICATIONS_SMS_SEND_URL: StroySnab.env.NOTIFICATIONS_SMS_SEND_URL,
      NOTIFICATIONS_SMS_SEND_TOKEN: StroySnab.env.NOTIFICATIONS_SMS_SEND_TOKEN,
      NOTIFICATIONS_SMS_SENDER: "StroySnab",
      NOTIFICATIONS_SMS_ORDER_TEMPLATE_ID: "66c03e11-d52b-403b-905a-7761080d3d7c",
      NOTIFICATIONS_SMS_ADMIN_TEMPLATE_ID: "cfb6a23b-08b5-47f6-ac43-30cb1d455aee",
      NOTIFICATIONS_SMS_DAILY_LIMIT: "100",
      NOTIFICATIONS_EMAIL_ENABLED: "true",
      NOTIFICATIONS_RESEND_API_KEY: StroySnab.env.NOTIFICATIONS_RESEND_API_KEY,
      NOTIFICATIONS_EMAIL_FROM: StroySnab.env.NOTIFICATIONS_EMAIL_FROM,
      NOTIFICATIONS_EMAIL_DAILY_LIMIT: "100",
      NOTIFICATIONS_SEND_AFTER: "2026-11-13T10:52:10.760323Z",
    },
  });
  return project("gregarious-vision", {
    resources: [StroySnab, notifications],
  });
});

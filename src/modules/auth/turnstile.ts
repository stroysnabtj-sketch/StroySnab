import { createHash } from "node:crypto";
import { ApiError } from "@/server/api-error";
import { consumeRateLimit } from "@/server/rate-limit";
import { configuredApplicationOrigins } from "@/modules/system/site-url";

export const CONTACT_CAPTCHA_ACTION = "contact_code";

export async function verifyContactCaptcha(input: {
  captchaToken?: unknown;
  purpose?: unknown;
  channel?: unknown;
}) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const siteKey = process.env.TURNSTILE_SITE_KEY;
  const required =
    input.purpose === "register" || input.purpose === "recover" || input.channel === "sms";
  if (!required) return;
  if (!secret || !siteKey) {
    if (process.env.NODE_ENV !== "production" && !secret && !siteKey) return;
    throw new ApiError(503, "captcha_unavailable", "Проверка временно недоступна");
  }
  const token = input.captchaToken;
  const invalid = () => new ApiError(400, "captcha_invalid", "Пройдите проверку ещё раз");
  if (typeof token !== "string" || !token || token.length > 2048) throw invalid();
  let result: { success?: boolean; action?: string; hostname?: string };
  try {
    const allowedHosts = new Set(
      [...configuredApplicationOrigins()].map((origin) => new URL(origin).hostname),
    );
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(5000),
      redirect: "error",
    });
    if (!response.ok) throw new Error("siteverify_failed");
    result = await response.json();
    if (
      result.success !== true ||
      result.action !== CONTACT_CAPTCHA_ACTION ||
      !allowedHosts.has(result.hostname ?? "")
    )
      throw invalid();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(503, "captcha_unavailable", "Проверка временно недоступна");
  }
  const digest = createHash("sha256").update(token).digest("hex");
  await consumeRateLimit(`turnstile:${digest}`, 1, 300);
}

import { NextResponse } from "next/server";
import { requestContactCode } from "@/modules/auth/contact-code";
import { errorResponse } from "@/server/api-error";
import { assertSameOrigin } from "@/server/security";
import { consumeRateLimit } from "@/server/rate-limit";
import { requestIp } from "@/server/request";
import { boundedJson } from "@/server/bounded-json";
import { verifyContactCaptcha } from "@/modules/auth/turnstile";
import { z } from "zod";
const captchaInput = z
  .object({
    purpose: z.enum(["login", "register", "recover"]),
    channel: z.enum(["sms", "email"]),
    captchaToken: z.string().max(2048).optional(),
    termsAccepted: z.boolean().optional(),
  })
  .superRefine((data, context) => {
    if (data.purpose === "register" && data.termsAccepted !== true)
      context.addIssue({
        code: "custom",
        path: ["termsAccepted"],
        message: "Примите условия обработки персональных данных",
      });
  });
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const ip = requestIp(request);
    await consumeRateLimit(`contact-code-send-ip:${ip}`, 10, 3600);
    const input = await boundedJson(request, 16 * 1024);
    const challenge = captchaInput.parse(input);
    await verifyContactCaptcha(challenge);
    if (challenge.channel === "sms") await consumeRateLimit("contact-code-sms-budget", 100, 86400);
    return NextResponse.json(await requestContactCode(input, ip), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return errorResponse(e);
  }
}

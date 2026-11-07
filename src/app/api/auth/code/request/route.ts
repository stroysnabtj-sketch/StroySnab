import { NextResponse } from "next/server";
import { requestContactCode } from "@/modules/auth/contact-code";
import { errorResponse } from "@/server/api-error";
import { assertSameOrigin } from "@/server/security";
import { consumeRateLimit } from "@/server/rate-limit";
import { requestIp } from "@/server/request";
import { boundedJson } from "@/server/bounded-json";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const ip = requestIp(request);
    await consumeRateLimit(`contact-code-send-ip:${ip}`, 10, 3600);
    return NextResponse.json(await requestContactCode(await boundedJson(request, 4096), ip), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return errorResponse(e);
  }
}

import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";
import { NextResponse } from "next/server";
import { forgotPassword } from "@/modules/auth/service";
import { errorResponse } from "@/server/api-error";
import { consumeRateLimit } from "@/server/rate-limit";
import { requestIp } from "@/server/request";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const ip = requestIp(request);
    await consumeRateLimit(`forgot:${ip}`, 5, 3600);
    const result = await forgotPassword(await parseJsonBody(request, 4096));
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}

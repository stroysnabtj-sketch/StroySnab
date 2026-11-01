import { NextResponse } from "next/server";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
import { consumeRateLimit } from "@/server/rate-limit";
import { login } from "@/modules/auth/service";
import { withSessionCookie } from "@/modules/auth/http";

export async function POST(request: Request) {
  try {
    const ip = requestIp(request);
    await consumeRateLimit(`login:${ip}`, 15, 900);
    const result = await login(await request.json(), ip, request.headers.get("user-agent") ?? "");
    return withSessionCookie(NextResponse.json({ role: result.role }), result.token);
  } catch (error) { return errorResponse(error); }
}

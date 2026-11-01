import { NextResponse } from "next/server";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
import { consumeRateLimit } from "@/server/rate-limit";
import { login, registerCustomer } from "@/modules/auth/service";
import { withSessionCookie } from "@/modules/auth/http";

export async function POST(request: Request) {
  try {
    const ip = requestIp(request);
    await consumeRateLimit(`register:${ip}`, 10, 3600);
    const input = await request.json();
    const user = await registerCustomer(input, ip);
    const session = await login({ identifier: user.phone, password: input.password }, ip, request.headers.get("user-agent") ?? "");
    return withSessionCookie(NextResponse.json({ user }, { status: 201 }), session.token);
  } catch (error) { return errorResponse(error); }
}

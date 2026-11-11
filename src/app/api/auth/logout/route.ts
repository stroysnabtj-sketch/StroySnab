import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logout } from "@/modules/auth/service";
import { SESSION_COOKIE } from "@/modules/auth/session";
import { clearSessionCookie } from "@/modules/auth/http";
import { requestIp } from "@/server/request";
import { errorResponse } from "@/server/api-error";
import { assertSameOrigin } from "@/server/security";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const jar = await cookies();
    await logout(jar.get(SESSION_COOKIE)?.value, requestIp(request));
    return clearSessionCookie(NextResponse.json({ ok: true }));
  } catch (error) {
    return errorResponse(error);
  }
}

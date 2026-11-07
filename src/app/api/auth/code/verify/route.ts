import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyContactCode } from "@/modules/auth/contact-code";
import { withSessionCookie } from "@/modules/auth/http";
import { adoptGuestCart } from "@/modules/cart/adopt-guest-cart";
import { errorResponse } from "@/server/api-error";
import { assertSameOrigin } from "@/server/security";
import { consumeRateLimit } from "@/server/rate-limit";
import { requestIp } from "@/server/request";
import { boundedJson } from "@/server/bounded-json";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const ip = requestIp(request);
    await consumeRateLimit(`contact-code-verify-ip:${ip}`, 30, 900);
    const result = await verifyContactCode(
      await boundedJson(request, 4096),
      ip,
      request.headers.get("user-agent") || "",
    );
    const adopted = await adoptGuestCart(result.userId, (await cookies()).get("kh_cart")?.value);
    const response = withSessionCookie(NextResponse.json({ role: result.role }), result.token);
    if (adopted) response.cookies.delete("kh_cart");
    return response;
  } catch (e) {
    return errorResponse(e);
  }
}

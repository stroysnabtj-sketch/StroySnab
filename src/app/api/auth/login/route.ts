import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";
import { NextResponse } from "next/server";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
import { consumeRateLimit } from "@/server/rate-limit";
import { login } from "@/modules/auth/service";
import { withSessionCookie } from "@/modules/auth/http";
import { cookies } from "next/headers";
import { adoptGuestCart } from "@/modules/cart/adopt-guest-cart";

export async function POST(request: Request) {
  try {
    const legacyPasswordEnabled =
      process.env.NODE_ENV !== "production" || process.env.AUTH_LEGACY_PASSWORD_LOGIN === "true";
    if (!legacyPasswordEnabled && process.env.AUTH_ADMIN_PASSWORD_LOGIN !== "true") {
      return NextResponse.json(
        {
          error: {
            code: "use_contact_code",
            message: "Используйте вход по коду из SMS или письма",
          },
        },
        { status: 410 },
      );
    }
    assertSameOrigin(request);
    const ip = requestIp(request);
    await consumeRateLimit(`login:${ip}`, 15, 900);
    const result = await login(
      await parseJsonBody(request, 4096),
      ip,
      request.headers.get("user-agent") ?? "",
      !legacyPasswordEnabled,
    );
    const adopted = await adoptGuestCart(result.userId, (await cookies()).get("kh_cart")?.value);
    const response = withSessionCookie(NextResponse.json({ role: result.role }), result.token);
    if (adopted) response.cookies.delete("kh_cart");
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}

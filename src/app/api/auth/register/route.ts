import { NextResponse } from "next/server";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
import { consumeRateLimit } from "@/server/rate-limit";
import { login, registerCustomer } from "@/modules/auth/service";
import { withSessionCookie } from "@/modules/auth/http";
import { cookies } from "next/headers";
import { adoptGuestCart } from "@/modules/cart/adopt-guest-cart";

export async function POST(request: Request) {
  try {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.AUTH_LEGACY_PASSWORD_LOGIN !== "true"
    ) {
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
    const ip = requestIp(request);
    await consumeRateLimit(`register:${ip}`, 10, 3600);
    const input = await request.json();
    const user = await registerCustomer(input, ip);
    const session = await login(
      { identifier: user.phone, password: input.password },
      ip,
      request.headers.get("user-agent") ?? "",
    );
    const adopted = await adoptGuestCart(user.id, (await cookies()).get("kh_cart")?.value);
    const response = withSessionCookie(NextResponse.json({ user }, { status: 201 }), session.token);
    if (adopted) response.cookies.delete("kh_cart");
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}

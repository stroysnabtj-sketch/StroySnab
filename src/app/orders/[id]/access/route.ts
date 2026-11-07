import { NextResponse } from "next/server";
import { getOrder } from "@/modules/orders/service";
import { ApiError, errorResponse } from "@/server/api-error";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = new URL(request.url).searchParams.get("token");
    if (
      !token ||
      !/^[A-Za-z0-9_-]{16,128}$/.test(token) ||
      !(await getOrder(id, { guestToken: token }))
    )
      throw new ApiError(404, "not_found", "Заказ не найден");
    const pathname = `/orders/${id}`;
    const response = NextResponse.redirect(new URL(pathname, request.url));
    response.cookies.set(`kh_order_${id}`, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: new URL(request.url).protocol === "https:",
      path: pathname,
      maxAge: 30 * 86400,
    });
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch (e) {
    return errorResponse(e);
  }
}

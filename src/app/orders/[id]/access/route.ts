import { NextResponse } from "next/server";
import { getOrder } from "@/modules/orders/service";
import { ApiError, errorResponse } from "@/server/api-error";
import { assertSameOrigin } from "@/server/security";
import { boundedJson } from "@/server/bounded-json";
import { jsonResponse } from "@/server/json";
import { z } from "zod";
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

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { id } = await params;
    const { token } = z
      .object({ token: z.string().regex(/^\d{10}\.[A-Za-z0-9_-]{43}$/) })
      .parse(await boundedJson(request, 256));
    if (!(await getOrder(id, { guestToken: token })))
      throw new ApiError(404, "not_found", "Ссылка недействительна или истекла");
    const path = `/orders/${id}`;
    const response = jsonResponse({ path });
    response.cookies.set(`kh_order_${id}`, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path,
      expires: new Date(Number(token.split(".")[0]) * 1000),
    });
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { currentUserId } from "@/modules/cart/service";
import { createOrder, orderInputSchema } from "@/modules/orders/service";
import { parseJsonBody } from "@/server/validation";
import { errorResponse } from "@/server/api-error";
export async function POST(req: Request) {
  try {
    const body = orderInputSchema.parse(await parseJsonBody(req));
    const jar = await cookies();
    const guestToken = jar.get("kh_cart")?.value;
    const userId = await currentUserId();
    const result = await createOrder({ ...body, userId, guestToken });
    const response = NextResponse.json(result, { status: 201 });
    if (!userId && guestToken)
      response.cookies.set(`kh_order_${result.id}`, guestToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: `/orders/${result.id}`,
        maxAge: 60 * 60 * 24 * 90,
      });
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}

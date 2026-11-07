import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { optionalUser } from "@/modules/auth/session";
import { getCart } from "@/modules/cart/service";
import { errorResponse } from "@/server/api-error";
export async function GET() {
  try {
    const user = await optionalUser();
    const jar = await cookies();
    const cart = await getCart(user?.id, jar.get("kh_cart")?.value);
    return NextResponse.json({ role: user?.role ?? null, cartCount: cart.items.length }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}

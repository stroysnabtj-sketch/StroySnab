import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { optionalUser } from "@/modules/auth/session";
import { getCartCount } from "@/modules/cart/service";
import { errorResponse } from "@/server/api-error";
export async function GET() {
  try {
    const user = await optionalUser();
    const jar = await cookies();
    const cartCount = await getCartCount(user?.id, jar.get("kh_cart")?.value);
    return NextResponse.json({ role: user?.role ?? null, cartCount }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return errorResponse(error); }
}

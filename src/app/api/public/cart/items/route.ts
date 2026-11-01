import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addCartItem, currentUserId } from "@/modules/cart/service";
import { errorResponse } from "@/server/api-error";
const schema = z.object({ offerId: z.string().uuid(), qty: z.string().regex(/^\d+(?:[.,]\d{1,3})?$/).default("1") });
export async function POST(request: NextRequest) { try { const input = schema.parse(await request.json()); const jar = await cookies(); const userId = await currentUserId(); const result = await addCartItem({ ...input, userId, guestToken: jar.get("kh_cart")?.value }); if (result.guestToken) jar.set("kh_cart", result.guestToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 86400 }); return NextResponse.json({ item: result.item }, { status: 201 }); } catch (error) { return errorResponse(error); } }

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentUserId, updateCartItem } from "@/modules/cart/service";
import { errorResponse } from "@/server/api-error";
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { try { const { id } = await params; const input = z.object({ qty: z.string() }).parse(await request.json()); const jar = await cookies(); await updateCartItem({ itemId: id, ...input, userId: await currentUserId(), guestToken: jar.get("kh_cart")?.value }); return NextResponse.json({ ok: true }); } catch (error) { return errorResponse(error); } }
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) { try { const { id } = await params; const jar = await cookies(); await updateCartItem({ itemId: id, qty: "0", userId: await currentUserId(), guestToken: jar.get("kh_cart")?.value }); return NextResponse.json({ ok: true }); } catch (error) { return errorResponse(error); } }

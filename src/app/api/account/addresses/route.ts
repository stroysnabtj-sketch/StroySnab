import { z } from "zod";
import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { listAddresses, saveAddress, deleteAddress } from "@/modules/account/addresses";
import { assertSameOrigin } from "@/server/security";
import { boundedJson } from "@/server/bounded-json";
import { ApiError, errorResponse } from "@/server/api-error";
async function buyer() {
  const actor = await requireUser();
  if (actor.role !== "CUSTOMER")
    throw new ApiError(403, "customer_required", "Доступно покупателю");
  return actor;
}
export async function GET() {
  try {
    return NextResponse.json(
      { items: await listAddresses((await buyer()).id) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await buyer();
    return NextResponse.json(await saveAddress(actor.id, await boundedJson(request, 8192)));
  } catch (e) {
    return errorResponse(e);
  }
}
export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await buyer();
    const { id } = z.object({ id: z.uuid() }).parse(await boundedJson(request));
    await deleteAddress(actor.id, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

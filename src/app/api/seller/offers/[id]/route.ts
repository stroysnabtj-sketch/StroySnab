import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { getSupplierForUser } from "@/modules/suppliers/service";
import { deactivateOffer, updateOffer } from "@/modules/suppliers/offer-service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const actor = await requireUser("seller:offers"); const membership = await getSupplierForUser(actor.id); return NextResponse.json(await updateOffer(actor, (await params).id, membership.supplier.id, await request.json(), requestIp(request))); } catch (error) { return errorResponse(error); } }
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const actor = await requireUser("seller:offers"); const membership = await getSupplierForUser(actor.id); return NextResponse.json(await deactivateOffer(actor, (await params).id, membership.supplier.id, requestIp(request))); } catch (error) { return errorResponse(error); } }

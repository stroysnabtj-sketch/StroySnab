import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { deactivateOffer, updateOffer } from "@/modules/suppliers/offer-service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const actor = await requireUser("suppliers:manage"); const body = await request.json() as { supplierId: string }; return NextResponse.json(await updateOffer(actor, (await params).id, body.supplierId, body, requestIp(request))); } catch (error) { return errorResponse(error); } }
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const actor = await requireUser("suppliers:manage"); return NextResponse.json(await deactivateOffer(actor, (await params).id, undefined, requestIp(request))); } catch (error) { return errorResponse(error); } }

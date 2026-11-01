import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { getSupplierForUser } from "@/modules/suppliers/service";
import { listOffers, upsertOffer } from "@/modules/suppliers/offer-service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
export async function GET() { try { const actor = await requireUser("seller:offers"); const membership = await getSupplierForUser(actor.id); return NextResponse.json({ items: await listOffers(membership.supplier.id) }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { const actor = await requireUser("seller:offers"); const membership = await getSupplierForUser(actor.id); return NextResponse.json(await upsertOffer(actor, membership.supplier.id, await request.json(), requestIp(request)), { status: 201 }); } catch (error) { return errorResponse(error); } }

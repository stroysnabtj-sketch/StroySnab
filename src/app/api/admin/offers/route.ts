import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { listOffers, upsertOffer } from "@/modules/suppliers/offer-service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
export async function GET(request: Request) { try { await requireUser("suppliers:manage"); return NextResponse.json({ items: await listOffers(new URL(request.url).searchParams.get("supplierId") ?? undefined) }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { const actor = await requireUser("suppliers:manage"); const body = await request.json() as { supplierId: string }; return NextResponse.json(await upsertOffer(actor, body.supplierId, body, requestIp(request)), { status: 201 }); } catch (error) { return errorResponse(error); } }

import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { adminListProducts, createProduct } from "@/modules/catalog/admin-service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
export async function GET(request: Request) { try { await requireUser("catalog:manage"); return NextResponse.json({ items: await adminListProducts(new URL(request.url).searchParams.get("q") ?? undefined) }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { const actor = await requireUser("catalog:manage"); const body = await request.json() as { status?: string }; if (body.status && body.status !== "DRAFT") await requireUser("catalog:moderate"); return NextResponse.json(await createProduct(actor, body, requestIp(request)), { status: 201 }); } catch (error) { return errorResponse(error); } }

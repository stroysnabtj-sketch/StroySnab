import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { archiveProduct, getProductAttributes, updateProduct } from "@/modules/catalog/admin-service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { try { await requireUser("catalog:manage"); return NextResponse.json({ items: await getProductAttributes((await params).id) }); } catch (error) { return errorResponse(error); } }
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const actor = await requireUser("catalog:manage"); const body = await request.json() as { status?: string }; if (body.status) await requireUser("catalog:moderate"); return NextResponse.json(await updateProduct(actor, (await params).id, body, requestIp(request))); } catch (error) { return errorResponse(error); } }
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const actor = await requireUser("catalog:manage"); return NextResponse.json(await archiveProduct(actor, (await params).id, requestIp(request))); } catch (error) { return errorResponse(error); } }

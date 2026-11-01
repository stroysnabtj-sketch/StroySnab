import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { updateSupplier } from "@/modules/suppliers/service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const actor = await requireUser("suppliers:manage"); return NextResponse.json(await updateSupplier(actor, (await params).id, await request.json(), requestIp(request))); } catch (error) { return errorResponse(error); } }

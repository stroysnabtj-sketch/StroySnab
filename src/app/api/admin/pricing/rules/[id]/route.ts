import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { deletePricingRule } from "@/modules/pricing/admin-service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const actor = await requireUser("pricing:manage"); return NextResponse.json(await deletePricingRule(actor, (await params).id, requestIp(request))); } catch (error) { return errorResponse(error); } }

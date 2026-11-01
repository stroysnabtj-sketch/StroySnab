import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { createPricingRule, listPricingRules } from "@/modules/pricing/admin-service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
export async function GET() { try { await requireUser("pricing:manage"); return NextResponse.json({ items: await listPricingRules() }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { const actor = await requireUser("pricing:manage"); return NextResponse.json(await createPricingRule(actor, await request.json(), requestIp(request)), { status: 201 }); } catch (error) { return errorResponse(error); } }

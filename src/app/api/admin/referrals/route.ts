import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { listAdminReferrals, updateReferralBonusPercent } from "@/modules/referrals/service";
import { errorResponse } from "@/server/api-error";
import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";
import { requestIp } from "@/server/request";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireUser("settings:manage");
    return NextResponse.json(await listAdminReferrals());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("settings:manage");
    const body = await parseJsonBody(request, 2048);
    return NextResponse.json(await updateReferralBonusPercent(actor, body, requestIp(request)));
  } catch (error) {
    return errorResponse(error);
  }
}

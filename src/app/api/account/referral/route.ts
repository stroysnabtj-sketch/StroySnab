import { NextResponse } from "next/server";
import { requireCustomer } from "@/modules/auth/session";
import { getReferralSummary } from "@/modules/referrals/service";
import { errorResponse } from "@/server/api-error";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const user = await requireCustomer();
    return NextResponse.json(await getReferralSummary(user.id), {
      headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
    });
  } catch (error) {
    const response = errorResponse(error);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}

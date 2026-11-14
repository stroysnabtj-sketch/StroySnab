import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth/session";
import { normalizeReferralCode, REFERRAL_COOKIE } from "@/modules/referrals/service";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const code = normalizeReferralCode((await params).code);
  const user = await getCurrentUser();
  const target = user
    ? user.role === "CUSTOMER"
      ? "/account/referral"
      : "/account"
    : code
      ? `/auth/register?ref=${encodeURIComponent(code)}`
      : "/auth/register";
  const response = new NextResponse(null, {
    status: 307,
    headers: {
      Location: target,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
      Vary: "Cookie",
    },
  });
  if (code && !user)
    response.cookies.set(REFERRAL_COOKIE, code, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 86400,
      path: "/",
    });
  return response;
}

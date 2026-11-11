import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";
import { NextResponse } from "next/server";
import { resetPassword } from "@/modules/auth/service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await resetPassword(await parseJsonBody(request, 4096), requestIp(request));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

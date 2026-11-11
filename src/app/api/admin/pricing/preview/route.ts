import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";
import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { previewPrice } from "@/modules/pricing/admin-service";
import { errorResponse } from "@/server/api-error";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requireUser("pricing:manage");
    return NextResponse.json(await previewPrice(await parseJsonBody(request, 8192)));
  } catch (error) {
    return errorResponse(error);
  }
}

import { assertSameOrigin } from "@/server/security";
import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { createInvitation } from "@/modules/suppliers/service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("suppliers:manage");
    return NextResponse.json(await createInvitation(actor, (await params).id, requestIp(request)), {
      status: 201,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

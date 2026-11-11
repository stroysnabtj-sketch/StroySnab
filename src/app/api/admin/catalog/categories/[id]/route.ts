import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";
import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { updateCategory } from "@/modules/catalog/admin-service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("catalog:manage");
    return NextResponse.json(
      await updateCategory(
        actor,
        (await params).id,
        await parseJsonBody(request, 8192),
        requestIp(request),
      ),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

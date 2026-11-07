import { requireUser } from "@/modules/auth/session";
import { changeOrderStatus } from "@/modules/orders/service";
import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";
import { errorResponse } from "@/server/api-error";
import { jsonResponse } from "@/server/json";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("orders:manage");
    return jsonResponse(
      await changeOrderStatus(actor, (await params).id, await parseJsonBody(request)),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

import { requireUser } from "@/modules/auth/session";
import { assignOrderDelivery } from "@/modules/orders/delivery-service";
import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";
import { errorResponse } from "@/server/api-error";
import { jsonResponse } from "@/server/json";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("deliveries:assign");
    return jsonResponse(
      await assignOrderDelivery(actor, (await params).id, await parseJsonBody(request)),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

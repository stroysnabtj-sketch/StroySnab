import { requireUser } from "@/modules/auth/session";
import { deactivateOffer, updateOffer } from "@/modules/suppliers/offer-service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";
import { jsonResponse } from "@/server/json";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("suppliers:manage");
    const body = await parseJsonBody<{ supplierId: string }>(request);
    const updated = await updateOffer(actor, (await params).id, body.supplierId, body, requestIp(request));
    return jsonResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("suppliers:manage");
    const result = await deactivateOffer(actor, (await params).id, undefined, requestIp(request));
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

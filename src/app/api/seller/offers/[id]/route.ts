import { requireUser } from "@/modules/auth/session";
import { getSupplierForUser } from "@/modules/suppliers/service";
import { deactivateOffer, updateOffer } from "@/modules/suppliers/offer-service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";
import { jsonResponse } from "@/server/json";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("seller:offers");
    const membership = await getSupplierForUser(actor.id);
    const body = await parseJsonBody(request);
    const updated = await updateOffer(
      actor,
      (await params).id,
      membership.supplier.id,
      body,
      requestIp(request),
    );
    return jsonResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("seller:offers");
    const membership = await getSupplierForUser(actor.id);
    const result = await deactivateOffer(actor, (await params).id, membership.supplier.id, requestIp(request));
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

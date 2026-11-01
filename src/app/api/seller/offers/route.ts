import { requireUser } from "@/modules/auth/session";
import { getSupplierForUser } from "@/modules/suppliers/service";
import { listOffers, upsertOffer } from "@/modules/suppliers/offer-service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";
import { jsonResponse } from "@/server/json";

export async function GET() {
  try {
    const actor = await requireUser("seller:offers");
    const membership = await getSupplierForUser(actor.id);
    return jsonResponse({ items: await listOffers(membership.supplier.id) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("seller:offers");
    const membership = await getSupplierForUser(actor.id);
    const body = await parseJsonBody(request);
    const saved = await upsertOffer(actor, membership.supplier.id, body, requestIp(request));
    return jsonResponse(saved, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

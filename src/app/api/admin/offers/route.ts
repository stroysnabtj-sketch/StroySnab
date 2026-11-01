import { requireUser } from "@/modules/auth/session";
import { listOffers, upsertOffer } from "@/modules/suppliers/offer-service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";
import { jsonResponse } from "@/server/json";

export async function GET(request: Request) {
  try {
    await requireUser("suppliers:manage");
    return jsonResponse({
      items: await listOffers(new URL(request.url).searchParams.get("supplierId") ?? undefined),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("suppliers:manage");
    const body = await parseJsonBody<{ supplierId: string }>(request);
    const saved = await upsertOffer(actor, body.supplierId, body, requestIp(request));
    return jsonResponse(saved, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

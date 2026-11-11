import { optionalUser, requireUser } from "@/modules/auth/session";
import { getProcurementRequest, updateProcurementStatus } from "@/modules/procurement/service";
import { parseJsonBody } from "@/server/validation";
import { assertSameOrigin } from "@/server/security";
import { errorResponse } from "@/server/api-error";
import { jsonResponse } from "@/server/json";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) {
  try {
    return jsonResponse(
      await getProcurementRequest(
        (await params).id,
        await optionalUser(),
        request.headers.get("x-request-access"),
      ),
    );
  } catch (e) {
    return errorResponse(e);
  }
}
export async function PATCH(request: Request, { params }: Context) {
  try {
    assertSameOrigin(request);
    return jsonResponse(
      await updateProcurementStatus(
        (await params).id,
        await requireUser("product_requests:manage"),
        await parseJsonBody(request, 8_192),
      ),
    );
  } catch (e) {
    return errorResponse(e);
  }
}

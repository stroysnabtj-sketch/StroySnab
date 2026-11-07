import { requireUser } from "@/modules/auth/session";
import { getShopOrder, updateShopOrderStatus } from "@/modules/suppliers/shop-service";
import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";
import { errorResponse } from "@/server/api-error";
import { jsonResponse } from "@/server/json";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    return jsonResponse(await getShopOrder(await requireUser("seller:offers"), (await params).id));
  } catch (error) {
    return errorResponse(error);
  }
}
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    return jsonResponse(
      await updateShopOrderStatus(
        await requireUser("seller:orders"),
        (await params).id,
        await parseJsonBody(request),
      ),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

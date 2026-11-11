import { requireUser } from "@/modules/auth/session";
import { getManagedOrder } from "@/modules/orders/service";
import {
  getOrderPaymentSummary,
  listOrderPayments,
  recordOrderPayment,
} from "@/modules/orders/payment-service";
import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";
import { ApiError, errorResponse } from "@/server/api-error";
import { jsonResponse } from "@/server/json";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) {
  try {
    const actor = await requireUser("orders:read"),
      { id } = await params;
    if (!(await getManagedOrder(actor, id)))
      throw new ApiError(404, "not_found", "Заказ не найден");
    return jsonResponse({
      summary: await getOrderPaymentSummary(id),
      items: await listOrderPayments(id),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(request: Request, { params }: Context) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("orders:manage");
    const { id } = await params;
    return jsonResponse(await recordOrderPayment(id, actor, await parseJsonBody(request, 8192)));
  } catch (error) {
    return errorResponse(error);
  }
}

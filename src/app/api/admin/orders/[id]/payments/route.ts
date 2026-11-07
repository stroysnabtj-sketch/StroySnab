import { requireUser } from '@/modules/auth/session';
import { getManagedOrder } from '@/modules/orders/service';
import { getOrderPaymentSummary, listOrderPayments, recordOrderPayment } from '@/modules/orders/payment-service';
import { assertSameOrigin } from '@/server/security';
import { ApiError, errorResponse } from '@/server/api-error';
import { jsonResponse } from '@/server/json';
type Context={params:Promise<{id:string}>};
export async function GET(_request:Request,{params}:Context){try{const actor=await requireUser('orders:read'),{id}=await params;if(!await getManagedOrder(actor,id))throw new ApiError(404,'not_found','Заказ не найден');return jsonResponse({summary:await getOrderPaymentSummary(id),items:await listOrderPayments(id)});}catch(e){return errorResponse(e);}}
export async function POST(request:Request,{params}:Context){try{assertSameOrigin(request);return jsonResponse(await recordOrderPayment((await params).id,await requireUser('orders:manage'),await request.json()));}catch(e){return errorResponse(e);}}

import { requireUser } from "@/modules/auth/session";
import { getShopProduct, updateShopProduct } from "@/modules/suppliers/shop-service";
import { errorResponse } from "@/server/api-error";
import { jsonResponse } from "@/server/json";
import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) { try { return jsonResponse(await getShopProduct(await requireUser("seller:offers"), (await params).id)); } catch (error) { return errorResponse(error); } }
export async function PATCH(request: Request, { params }: Context) { try { assertSameOrigin(request); return jsonResponse(await updateShopProduct(await requireUser("seller:offers"), (await params).id, await parseJsonBody(request))); } catch (error) { return errorResponse(error); } }

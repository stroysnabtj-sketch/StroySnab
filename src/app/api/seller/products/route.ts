import { requireUser } from "@/modules/auth/session";
import { createShopProduct, listShopProducts } from "@/modules/suppliers/shop-service";
import { errorResponse } from "@/server/api-error";
import { jsonResponse } from "@/server/json";
import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";
export async function GET() { try { return jsonResponse({ items: await listShopProducts(await requireUser("seller:offers")) }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { assertSameOrigin(request); return jsonResponse(await createShopProduct(await requireUser("seller:offers"), await parseJsonBody(request)), { status: 201 }); } catch (error) { return errorResponse(error); } }

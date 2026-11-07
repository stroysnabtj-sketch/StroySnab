import { requireUser } from "@/modules/auth/session";
import { listShopOrders } from "@/modules/suppliers/shop-service";
import { errorResponse } from "@/server/api-error";
import { jsonResponse } from "@/server/json";
export async function GET() { try { return jsonResponse({ items: await listShopOrders(await requireUser("seller:offers")) }); } catch (error) { return errorResponse(error); } }

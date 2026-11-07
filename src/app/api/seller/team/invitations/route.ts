import { requireUser } from "@/modules/auth/session";
import { createInvitation } from "@/modules/suppliers/service";
import { shopMembership } from "@/modules/suppliers/shop-service";
import { ApiError, errorResponse } from "@/server/api-error";
import { jsonResponse } from "@/server/json";
import { assertSameOrigin } from "@/server/security";
export async function POST(request: Request) { try { assertSameOrigin(request); const actor = await requireUser("seller:offers"); const membership = await shopMembership(actor, true); if (membership.role !== "OWNER") throw new ApiError(403, "forbidden", "Приглашать сотрудников может владелец магазина"); return jsonResponse(await createInvitation(actor, membership.supplier.id), { status: 201 }); } catch (error) { return errorResponse(error); } }

import { optionalUser, requireUser } from "@/modules/auth/session";
import { createProcurementRequest, listProcurementRequests } from "@/modules/procurement/service";
import { assertSameOrigin } from "@/server/security";
import { consumeRateLimit } from "@/server/rate-limit";
import { requestIp } from "@/server/request";
import { errorResponse } from "@/server/api-error";
import { jsonResponse } from "@/server/json";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await consumeRateLimit(`procurement:${requestIp(request)}`, 10, 3600);
    return jsonResponse(
      await createProcurementRequest(await request.json(), await optionalUser()),
      { status: 201 },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
export async function GET(request: Request) {
  try {
    const p = new URL(request.url).searchParams;
    return jsonResponse(
      await listProcurementRequests(await requireUser(), {
        q: p.get("q") ?? undefined,
        status: p.get("status") ?? undefined,
        payment: p.get("payment") ?? undefined,
        page: Number(p.get("page") ?? 1),
      }),
    );
  } catch (e) {
    return errorResponse(e);
  }
}

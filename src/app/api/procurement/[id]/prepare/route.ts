import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { prepareQuotationCandidates } from "@/modules/procurement/preparation";
import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";
import { consumeRateLimit } from "@/server/rate-limit";
import { errorResponse } from "@/server/api-error";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("product_requests:manage");
    await consumeRateLimit(`quotation-prepare:${actor.id}`, 20, 900);
    const body = await parseJsonBody<{ lines: unknown }>(request, 128 * 1024);
    return NextResponse.json(
      await prepareQuotationCandidates((await params).id, actor, body.lines),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}

import { requireUser } from "@/modules/auth/session";
import { retryQuotationJob } from "@/modules/procurement/ai-jobs";
import { assertSameOrigin } from "@/server/security";
import { errorResponse } from "@/server/api-error";
import { jsonResponse } from "@/server/json";
import { z } from "zod";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("product_requests:manage");
    return jsonResponse(await retryQuotationJob(z.uuid().parse((await params).id), actor));
  } catch (error) {
    return errorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { uploadQuotationImage } from "@/modules/procurement/images";
import { errorResponse, ApiError } from "@/server/api-error";
import { assertSameOrigin } from "@/server/security";
import { boundedForm } from "@/server/bounded-form";
import { consumeRateLimit } from "@/server/rate-limit";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("product_requests:manage");
    await consumeRateLimit(`quote-image:${actor.id}`, 60, 3600);
    const form = await boundedForm(request, 6 * 1024 * 1024),
      file = form.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "file_required", "Выберите фото");
    return NextResponse.json(await uploadQuotationImage((await params).id, actor, file));
  } catch (e) {
    return errorResponse(e);
  }
}

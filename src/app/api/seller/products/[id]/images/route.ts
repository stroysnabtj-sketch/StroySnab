import { boundedForm } from "@/server/bounded-form";
import { requireUser } from "@/modules/auth/session";
import { uploadShopImage } from "@/modules/suppliers/shop-service";
import { ApiError, errorResponse } from "@/server/api-error";
import { jsonResponse } from "@/server/json";
import { assertSameOrigin } from "@/server/security";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("seller:offers");
    const form = await boundedForm(request, 6 * 1024 * 1024);
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "invalid_file", "Выберите изображение");
    return jsonResponse(await uploadShopImage(actor, (await params).id, file), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

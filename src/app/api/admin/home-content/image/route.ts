import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { uploadHomeImage } from "@/modules/merchandising/home-images";
import { assertSameOrigin } from "@/server/security";
import { boundedForm } from "@/server/bounded-form";
import { ApiError, errorResponse } from "@/server/api-error";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("catalog:manage");
    const form = await boundedForm(request, 6 * 1024 * 1024);
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "invalid_file", "Выберите изображение");
    return NextResponse.json(await uploadHomeImage(actor, file), {
      status: 201,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

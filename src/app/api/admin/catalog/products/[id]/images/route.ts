import { assertSameOrigin } from "@/server/security";
import { NextResponse } from "next/server";
import { boundedForm } from "@/server/bounded-form";
import { requireUser } from "@/modules/auth/session";
import { uploadProductImage } from "@/modules/catalog/image-service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("catalog:manage");
    const form = await boundedForm(request, 6 * 1024 * 1024);
    const file = form.get("file");
    if (!(file instanceof File))
      return NextResponse.json(
        { error: { code: "validation_failed", message: "Выберите файл" } },
        { status: 400 },
      );
    return NextResponse.json(
      await uploadProductImage(actor, (await params).id, file, { ip: requestIp(request) }),
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";
import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { createCategory } from "@/modules/catalog/admin-service";
import { listCategories } from "@/modules/catalog/service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
export async function GET() {
  try {
    await requireUser("catalog:manage");
    return NextResponse.json({ items: await listCategories({ includeInactive: true }) });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("catalog:manage");
    return NextResponse.json(
      await createCategory(actor, await parseJsonBody(request, 8192), requestIp(request)),
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";
import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { createSupplier, listSuppliers } from "@/modules/suppliers/service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
export async function GET() {
  try {
    await requireUser("suppliers:manage");
    return NextResponse.json({ items: await listSuppliers() });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("suppliers:manage");
    return NextResponse.json(
      await createSupplier(actor, await parseJsonBody(request, 16384), requestIp(request)),
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

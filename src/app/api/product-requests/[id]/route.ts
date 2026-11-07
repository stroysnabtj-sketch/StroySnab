import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { getManagedRequest, respondProductRequest } from "@/modules/product-requests/service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireUser();
    const { id } = await params;
    const result = await getManagedRequest(actor, id);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser();
    const { id } = await params;
    const body = await parseJsonBody(request);
    const result = await respondProductRequest(actor, id, body, requestIp(request));
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}


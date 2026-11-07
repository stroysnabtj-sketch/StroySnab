import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { cancelOwnRequest, getOwnRequest } from "@/modules/product-requests/service";
import { errorResponse, ApiError } from "@/server/api-error";
import { requestIp } from "@/server/request";
import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    if (user.role !== "CUSTOMER") {
      throw new ApiError(403, "forbidden", "Доступ только для покупателей");
    }
    const { id } = await params;
    const result = await getOwnRequest(user.id, id);
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
    const user = await requireUser();
    if (user.role !== "CUSTOMER") {
      throw new ApiError(403, "forbidden", "Доступ только для покупателей");
    }
    const { id } = await params;
    const body = await parseJsonBody<Record<string, unknown>>(request);

    if (body.action && body.action !== "cancel") {
      throw new ApiError(400, "invalid_action", "Поддерживается только действие 'cancel'");
    }

    const result = await cancelOwnRequest(user.id, id, body, requestIp(request));
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}


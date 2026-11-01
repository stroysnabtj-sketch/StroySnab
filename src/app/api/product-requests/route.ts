import { NextResponse } from "next/server";
import { optionalUser } from "@/modules/auth/session";
import { createProductRequest } from "@/modules/product-requests/service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await parseJsonBody(request);
    const user = await optionalUser();
    const result = await createProductRequest(body, user, requestIp(request));
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

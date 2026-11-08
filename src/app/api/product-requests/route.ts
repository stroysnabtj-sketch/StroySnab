import { NextResponse } from "next/server";
import { requireCustomer, requireUser } from "@/modules/auth/session";
import { createProductRequest, listManagedRequests } from "@/modules/product-requests/service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const result = await listManagedRequests(user, {
      status: url.searchParams.get("status") || undefined,
      q: url.searchParams.get("q") || undefined,
      page: Number(url.searchParams.get("page")) || 1,
      pageSize: Number(url.searchParams.get("pageSize")) || 25,
      sort: url.searchParams.get("sort") || undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireCustomer();
    const body = await parseJsonBody(request);
    const result = await createProductRequest(body, user, requestIp(request));
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

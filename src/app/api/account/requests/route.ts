import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { listOwnRequests } from "@/modules/product-requests/service";
import { errorResponse, ApiError } from "@/server/api-error";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    if (user.role !== "CUSTOMER") {
      throw new ApiError(403, "forbidden", "Кабинет доступен только покупателям");
    }

    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const pageSize = Number(url.searchParams.get("pageSize")) || 25;

    const result = await listOwnRequests(user.id, { page, pageSize });
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}


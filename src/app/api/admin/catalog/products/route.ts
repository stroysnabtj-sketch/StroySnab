import { assertSameOrigin } from "@/server/security";
import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import {
  adminListProducts,
  searchAdminProducts,
  createProduct,
} from "@/modules/catalog/admin-service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
export async function GET(request: Request) {
  try {
    await requireUser("catalog:manage");
    const query = new URL(request.url).searchParams;
    return NextResponse.json(
      query.has("page")
        ? await searchAdminProducts({
            q: query.get("q") ?? undefined,
            status: query.get("status") ?? undefined,
            categoryId: query.get("categoryId") ?? undefined,
            page: Number(query.get("page")),
            pageSize: Number(query.get("pageSize") || 24),
          })
        : { items: await adminListProducts(query.get("q") ?? undefined) },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("catalog:manage");
    const body = (await request.json()) as { status?: string };
    if (body.status && body.status !== "DRAFT") await requireUser("catalog:moderate");
    return NextResponse.json(await createProduct(actor, body, requestIp(request)), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

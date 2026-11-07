import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import {
  getAdminHomeCollections,
  replaceHomeCollection,
  searchHomeCollectionProducts,
} from "@/modules/merchandising/service";
import { errorResponse } from "@/server/api-error";
import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";
import { requestIp } from "@/server/request";

export async function GET(request: Request) {
  try {
    const actor = await requireUser("catalog:manage");
    const q = new URL(request.url).searchParams.get("q");
    if (q !== null)
      return NextResponse.json({ products: await searchHomeCollectionProducts(actor, q) });
    return NextResponse.json({ items: await getAdminHomeCollections(actor) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("catalog:manage");
    const body = await parseJsonBody<{ collection?: unknown; productIds?: unknown }>(request, 4096);
    await replaceHomeCollection(actor, body.collection, body.productIds, requestIp(request));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

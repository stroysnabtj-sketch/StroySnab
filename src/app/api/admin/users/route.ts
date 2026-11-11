import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";
import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { createEmployee, listUsers, searchUsers } from "@/modules/auth/admin-service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
export async function GET(request: Request) {
  try {
    await requireUser("users:manage");
    const q = new URL(request.url).searchParams;
    return NextResponse.json(
      q.has("page")
        ? await searchUsers({
            q: q.get("q") ?? undefined,
            role: q.get("role") ?? undefined,
            status: q.get("status") ?? undefined,
            page: Number(q.get("page")),
          })
        : {
            items: await listUsers({
              q: q.get("q") ?? undefined,
              role: q.get("role") ?? undefined,
              status: q.get("status") ?? undefined,
            }),
          },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("users:manage");
    const result = await createEmployee(
      actor,
      await parseJsonBody(request, 8192),
      requestIp(request),
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

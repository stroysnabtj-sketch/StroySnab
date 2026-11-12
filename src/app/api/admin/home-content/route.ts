import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/modules/auth/session";
import { getHomeContent, saveHomeContent } from "@/modules/merchandising/home-content-service";
import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";
import { requestIp } from "@/server/request";
import { errorResponse } from "@/server/api-error";

export async function GET() {
  try {
    await requireUser("catalog:manage");
    return NextResponse.json(
      { content: await getHomeContent() },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("catalog:manage");
    const content = await saveHomeContent(
      actor,
      await parseJsonBody(request, 16384),
      requestIp(request),
    );
    revalidatePath("/");
    return NextResponse.json({ content }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}

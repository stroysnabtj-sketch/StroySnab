import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { updateProfile } from "@/modules/auth/service";
import { errorResponse } from "@/server/api-error";
import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";
export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    return NextResponse.json(await updateProfile(user.id, await parseJsonBody(request, 4096)));
  } catch (error) {
    return errorResponse(error);
  }
}

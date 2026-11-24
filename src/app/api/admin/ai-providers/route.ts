import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { selectDocumentProvider } from "@/modules/procurement/document-provider-settings";
import { errorResponse } from "@/server/api-error";
import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("settings:manage");
    return NextResponse.json(await selectDocumentProvider(actor, await parseJsonBody(request, 2048)));
  } catch (error) {
    return errorResponse(error);
  }
}

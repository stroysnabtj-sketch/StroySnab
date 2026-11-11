import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions } from "@/db/schema";
import { requireUser } from "@/modules/auth/session";
import { errorResponse } from "@/server/api-error";
import { assertSameOrigin } from "@/server/security";
import { jsonResponse } from "@/server/json";
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const id = z.uuid().parse((await params).id);
    const db = await getDb();
    await db.delete(sessions).where(and(eq(sessions.id, id), eq(sessions.userId, user.id)));
    return jsonResponse({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

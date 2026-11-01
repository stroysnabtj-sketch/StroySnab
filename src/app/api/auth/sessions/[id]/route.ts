import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions } from "@/db/schema";
import { requireUser } from "@/modules/auth/session";
import { errorResponse } from "@/server/api-error";
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const user = await requireUser(); const { id } = await params; const db = await getDb(); await db.delete(sessions).where(and(eq(sessions.id, id), eq(sessions.userId, user.id))); return NextResponse.json({ ok: true }); }
  catch (error) { return errorResponse(error); }
}

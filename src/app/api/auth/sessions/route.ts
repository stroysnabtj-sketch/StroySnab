import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions } from "@/db/schema";
import { requireUser } from "@/modules/auth/session";
import { errorResponse } from "@/server/api-error";
export async function GET() {
  try { const user = await requireUser(); const db = await getDb(); const items = await db.select({ id: sessions.id, ip: sessions.ip, userAgent: sessions.userAgent, createdAt: sessions.createdAt, expiresAt: sessions.expiresAt }).from(sessions).where(eq(sessions.userId, user.id)).orderBy(desc(sessions.createdAt)); return NextResponse.json({ items }); }
  catch (error) { return errorResponse(error); }
}

import { auditLog } from "@/db/schema";
import type { DbExecutor } from "@/db";

export async function writeAudit(db: DbExecutor, entry: { actorUserId?: string | null; actorRole?: string; action: string; entity: string; entityId?: string | null; data?: Record<string, unknown>; ip?: string | null }) {
  await db.insert(auditLog).values({ ...entry, entityId: entry.entityId ?? null, data: entry.data ?? null });
}

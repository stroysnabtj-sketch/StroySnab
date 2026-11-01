import { createHash } from "node:crypto";
import { and, desc, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { productRequests } from "@/db/schema";
import type { SessionUser } from "@/modules/auth/session";
import { writeAudit } from "@/modules/audit/service";
import { nextDocNumber } from "@/modules/system/doc-number";
import { normalizePhone } from "@/modules/system/phone";
import { consumeRateLimit } from "@/server/rate-limit";
import { productRequestSchema } from "./schemas";
const empty = (value?: string | null) => value?.trim() ? value.trim() : null;
export async function createProductRequest(input: unknown, user: SessionUser | null, ip: string) {
  const data = productRequestSchema.parse(input);
  if (data.website) return { id: null, number: "PRQ-0000", status: "NEW", createdAt: new Date() };
  const phone = normalizePhone(data.contactPhone);
  const fingerprint = createHash("sha256").update(JSON.stringify({ ip, productName: data.productName, description: data.description, quantity: data.quantity, unit: data.unit, requiredDate: data.requiredDate, contactName: data.contactName, phone, email: data.contactEmail })).digest("hex");
  const db = await getDb(); const [duplicate] = await db.select({ id: productRequests.id, number: productRequests.number, status: productRequests.status, createdAt: productRequests.createdAt }).from(productRequests).where(and(eq(productRequests.fingerprint, fingerprint), gt(productRequests.createdAt, new Date(Date.now() - 30000)))).orderBy(desc(productRequests.createdAt)).limit(1);
  if (duplicate) return duplicate;
  await consumeRateLimit(`product-request:${ip}`, 10, 3600);
  return db.transaction(async (tx) => { const number = await nextDocNumber(tx, "PRQ"); const [created] = await tx.insert(productRequests).values({ number, userId: user?.role === "CUSTOMER" ? user.id : null, productName: data.productName, description: empty(data.description), quantity: data.quantity?.replace(",", ".") ?? null, unit: empty(data.unit), requiredDate: data.requiredDate || null, contactName: data.contactName, contactPhone: phone, contactEmail: empty(data.contactEmail)?.toLowerCase(), fingerprint }).returning({ id: productRequests.id, number: productRequests.number, status: productRequests.status, createdAt: productRequests.createdAt }); await writeAudit(tx, { actorUserId: user?.id, actorRole: user?.role ?? "GUEST", action: "product_request.created", entity: "product_requests", entityId: created.id, data: { number }, ip }); return created; });
}

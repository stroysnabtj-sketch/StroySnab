import { createHash } from "node:crypto";
import { getDb } from "@/db";
import { productRequests } from "@/db/schema";
import type { SessionUser } from "@/modules/auth/session";
import { writeAudit } from "@/modules/audit/service";
import { nextDocNumber } from "@/modules/system/doc-number";
import { normalizePhone } from "@/modules/system/phone";
import { consumeRateLimit } from "@/server/rate-limit";
import { makeProductRequestSchema } from "./schemas";
import {
  findRecentRequestByFingerprint,
  recordIdempotencyKey,
  withIdempotencyLock,
  type ProductRequestResult,
} from "./idempotency";

export async function createProductRequest(
  input: unknown,
  user: SessionUser | null,
  ip: string
): Promise<ProductRequestResult> {
  const schema = makeProductRequestSchema(new Date());
  const data = schema.parse(input);

  // Honeypot check
  if (data.website && data.website.trim() !== "") {
    return { id: null, number: "PRQ-0000", status: "NEW", createdAt: new Date() };
  }

  // Normalize phone
  const phone = normalizePhone(data.contactPhone);

  // Build owner-aware fingerprint for deduplication
  const ownerContext = user?.role === "CUSTOMER" ? `user:${user.id}` : `ip:${ip}`;
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        owner: ownerContext,
        productName: data.productName,
        description: data.description,
        quantity: data.quantity,
        unit: data.unit,
        requiredDate: data.requiredDate,
        contactName: data.contactName,
        phone,
        email: data.contactEmail,
      })
    )
    .digest("hex");

  // Idempotency lock prevents concurrent race conditions
  return await withIdempotencyLock(fingerprint, async () => {
    // Check if an identical request was already created within the last 30 seconds
    const duplicate = await findRecentRequestByFingerprint(fingerprint, 30000);
    if (duplicate) {
      return duplicate;
    }

    // Rate limit: 10 non-duplicate requests per hour per IP
    await consumeRateLimit(`product-request:${ip}`, 10, 3600);

    const db = await getDb();
    const created = await db.transaction(async (tx) => {
      const number = await nextDocNumber(tx, "PRQ");
      const [record] = await tx
        .insert(productRequests)
        .values({
          number,
          userId: user?.role === "CUSTOMER" ? user.id : null,
          productName: data.productName,
          description: data.description,
          quantity: data.quantity,
          unit: data.unit,
          requiredDate: data.requiredDate,
          contactName: data.contactName,
          contactPhone: phone,
          contactEmail: data.contactEmail,
          fingerprint,
        })
        .returning({
          id: productRequests.id,
          number: productRequests.number,
          status: productRequests.status,
          createdAt: productRequests.createdAt,
        });

      await writeAudit(tx, {
        actorUserId: user?.id,
        actorRole: user?.role ?? "GUEST",
        action: "product_request.created",
        entity: "product_requests",
        entityId: record.id,
        data: { number },
        ip,
      });

      return record;
    });

    try {
      await recordIdempotencyKey(fingerprint, created.id);
    } catch {
      // Non-critical key recording error
    }

    return created;
  });
}

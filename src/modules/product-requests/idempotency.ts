import { and, desc, eq, gt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { productRequestIdempotency, productRequests } from "@/db/schema";

export type ProductRequestResult = {
  id: string | null;
  number: string;
  status: string;
  createdAt: Date;
};

// In-process lock map to serialize concurrent promises on the same fingerprint
const inProcessLocks = new Map<string, Promise<void>>();

export async function withIdempotencyLock<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  // Wait for any existing in-process operation on this key
  while (inProcessLocks.has(key)) {
    try {
      await inProcessLocks.get(key);
    } catch {
      // Previous operation failed, lock will be released
    }
  }

  let releaseLock: () => void;
  const lockPromise = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  inProcessLocks.set(key, lockPromise);

  try {
    return await fn();
  } finally {
    inProcessLocks.delete(key);
    releaseLock!();
  }
}

export async function findRecentRequestByFingerprint(
  fingerprint: string,
  windowMs = 30000
): Promise<ProductRequestResult | null> {
  const db = await getDb();
  const cutoff = new Date(Date.now() - windowMs);

  const [existing] = await db
    .select({
      id: productRequests.id,
      number: productRequests.number,
      status: productRequests.status,
      createdAt: productRequests.createdAt,
    })
    .from(productRequests)
    .where(
      and(
        eq(productRequests.fingerprint, fingerprint),
        gt(productRequests.createdAt, cutoff)
      )
    )
    .orderBy(desc(productRequests.createdAt))
    .limit(1);

  return existing ?? null;
}

export async function recordIdempotencyKey(key: string, requestId: string, windowMs = 30000) {
  const db = await getDb();
  const expiresAt = new Date(Date.now() + windowMs);

  await db
    .insert(productRequestIdempotency)
    .values({
      key,
      requestId,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: productRequestIdempotency.key,
      set: {
        requestId,
        expiresAt,
        createdAt: sql`now()`,
      },
    });
}


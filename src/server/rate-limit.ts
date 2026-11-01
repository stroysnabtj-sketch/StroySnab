import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { rateLimits } from "@/db/schema";
import { ApiError } from "./api-error";

export async function consumeRateLimit(key: string, limit: number, windowSeconds: number): Promise<void> {
  const db = await getDb();
  const result = await db.execute<{ allowed: boolean; retry_after: number }>(sql`
    INSERT INTO ${rateLimits} ("key", "window_start", "count")
    VALUES (${key}, now(), 1)
    ON CONFLICT ("key") DO UPDATE SET
      "window_start" = CASE WHEN ${rateLimits.windowStart} < now() - (${windowSeconds} * interval '1 second') THEN now() ELSE ${rateLimits.windowStart} END,
      "count" = CASE WHEN ${rateLimits.windowStart} < now() - (${windowSeconds} * interval '1 second') THEN 1 ELSE ${rateLimits.count} + 1 END
    RETURNING 
      "count" <= ${limit} AS allowed,
      GREATEST(1, CEIL(EXTRACT(EPOCH FROM (${rateLimits.windowStart} + (${windowSeconds} * interval '1 second') - now()))))::int AS retry_after
  `);

  const row = result.rows[0];
  if (!row?.allowed) {
    const retryAfter = row?.retry_after ?? windowSeconds;
    throw new ApiError(429, "rate_limited", "Слишком много запросов, попробуйте позже", undefined, {
      "Retry-After": String(retryAfter),
    });
  }
}

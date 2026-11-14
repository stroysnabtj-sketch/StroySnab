import { NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { priceHistory } from "@/db/schema";
import { requireUser } from "@/modules/auth/session";
import { errorResponse } from "@/server/api-error";
export async function GET(request: Request) {
  try {
    await requireUser("pricing:manage");
    const page = z.coerce
      .number()
      .int()
      .min(1)
      .max(1000)
      .parse(new URL(request.url).searchParams.get("page") ?? 1);
    const db = await getDb();
    const rows = await db
      .select({
        id: priceHistory.id,
        entityType: priceHistory.entityType,
        entityId: priceHistory.entityId,
        operation: priceHistory.operation,
        before: priceHistory.before,
        after: priceHistory.after,
        recordedAt: priceHistory.recordedAt,
        label: sql<string>`coalesce((select p.name_ru from products p where p.id=case when ${priceHistory.entityType}='product_markup' then ${priceHistory.entityId} when ${priceHistory.entityType}='supplier_offer' then coalesce(${priceHistory.after}->>'productId',${priceHistory.before}->>'productId')::uuid else null end),${priceHistory.after}->>'sku',${priceHistory.before}->>'sku',${priceHistory.entityId}::text)`,
      })
      .from(priceHistory)
      .orderBy(desc(priceHistory.recordedAt), desc(priceHistory.id))
      .limit(51)
      .offset((page - 1) * 50);
    return NextResponse.json(
      { entries: rows.slice(0, 50), hasMore: rows.length > 50, page },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

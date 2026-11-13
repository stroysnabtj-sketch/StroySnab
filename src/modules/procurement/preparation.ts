import { materialMatchScore, sameMaterialUnit } from "./material-match";
import { publicProductText } from "@/modules/catalog/public-text";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { supplierOffers, products, suppliers } from "@/db/schema";
import { visibleCategoryIds } from "@/modules/catalog/category-visibility";
import type { SessionUser } from "@/modules/auth/session";
import { hasPermission } from "@/modules/rbac/permissions";
import { ApiError } from "@/server/api-error";
import { getProcurementRequest } from "./service";
const normalize = (s: string) =>
  s
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
const input = z
  .array(
    z.object({
      name: z.string().trim().min(1).max(300),
      qty: z
        .string()
        .regex(/^(?:0|[1-9]\d{0,6})(?:[.,]\d{1,3})?$/)
        .refine((v) => Number(v.replace(",", ".")) > 0),
      unit: z.string().trim().min(1).max(30),
    }),
  )
  .min(1)
  .max(200);
export async function prepareQuotationCandidates(
  requestId: string,
  actor: SessionUser,
  raw: unknown,
) {
  if (!hasPermission(actor.role, "product_requests:manage"))
    throw new ApiError(403, "forbidden", "Недостаточно прав");
  await getProcurementRequest(requestId, actor, null);
  const lines = input.parse(raw),
    db = await getDb();
  const output = [];
  // Bounded sequential batches avoid exhausting the database pool on large lists.
  for (let offset = 0; offset < lines.length; offset += 5) {
    const batch = await Promise.all(
      lines.slice(offset, offset + 5).map(async (line, index) => {
        const words = normalize(line.name)
          .split(" ")
          .filter((w) => w.length > 1)
          .slice(0, 12);
        const literal = line.name.replace(/[\\%_]/g, "\\$&");
        const rows = await db
          .select({
            offerId: supplierOffers.id,
            productName: products.nameRu,
            sku: products.sku,
            unit: products.unit,
            markupPercent: products.markupPercent,
            supplierName: suppliers.name,
            basePriceDirams: supplierOffers.supplierPriceDirams,
            stockQty: supplierOffers.stockQty,
            reservedQty: supplierOffers.reservedQty,
            minOrderQty: supplierOffers.minOrderQty,
            leadTimeDays: supplierOffers.leadTimeDays,
          })
          .from(supplierOffers)
          .innerJoin(products, eq(products.id, supplierOffers.productId))
          .innerJoin(suppliers, eq(suppliers.id, supplierOffers.supplierId))
          .where(
            and(
              eq(supplierOffers.isActive, "true"),
              eq(products.status, "PUBLISHED"),
              eq(suppliers.status, "ACTIVE"),
              sql`${products.categoryId} IN (${visibleCategoryIds})`,
              sql`CAST(${supplierOffers.supplierPriceDirams} AS numeric)>0`,
              or(
                eq(products.sku, line.name),
                ilike(products.nameRu, `%${literal}%`),
                words.length
                  ? or(...words.map((w) => ilike(products.nameRu, `%${w}%`)))
                  : undefined,
              ),
            ),
          )
          .orderBy(
            sql`CASE WHEN lower(${products.nameRu})=lower(${line.name}) OR ${products.sku}=${line.name} THEN 0 ELSE 1 END`,
            words.length
              ? sql`(${sql.join(
                  words.map(
                    (w) => sql`CASE WHEN ${products.nameRu} ILIKE ${`%${w}%`} THEN 1 ELSE 0 END`,
                  ),
                  sql` + `,
                )}) DESC`
              : products.nameRu,
            products.nameRu,
            supplierOffers.id,
          )
          .limit(40);
        const candidates = rows.map((row) => ({
          ...row,
          basePriceDirams: row.basePriceDirams.toString(),
          exact:
            normalize(publicProductText(row.productName)) ===
              normalize(publicProductText(line.name)) || row.sku === line.name,
          unitMatches: sameMaterialUnit(row.unit, line.unit),
          score: row.sku === line.name ? 100 : materialMatchScore(line.name, row.productName),
          enoughStock:
            Number(row.stockQty) - Number(row.reservedQty) >= Number(line.qty.replace(",", ".")),
          minimumMet: Number(line.qty.replace(",", ".")) >= Number(row.minOrderQty),
        }));
        return {
          index: offset + index,
          requested: line,
          candidates: candidates.filter((c) => c.score > 0).sort((a, b) => b.score - a.score),
        };
      }),
    );
    output.push(...batch);
  }
  return { mode: "LOCAL_CATALOG" as const, aiConnected: false as const, lines: output };
}
export type QuotationPreparation = Awaited<ReturnType<typeof prepareQuotationCandidates>>;

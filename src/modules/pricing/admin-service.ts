import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { pricingRules, products } from "@/db/schema";
import type { SessionUser } from "@/modules/auth/session";
import { writeAudit } from "@/modules/audit/service";
import { ApiError } from "@/server/api-error";
import { calculateCustomerPrice } from "./service";
export const pricingRuleInput = z
  .object({
    scope: z.enum(["GLOBAL", "CATEGORY", "SUPPLIER", "PRODUCT"]),
    scopeId: z.string().uuid().optional().nullable(),
    type: z.enum(["PERCENT", "FIXED"]),
    value: z.string().regex(/^\d+(?:\.\d{1,4})?$/),
    priority: z.number().int().min(-1000).max(1000).default(0),
    activeFrom: z.string().datetime().optional().nullable(),
    activeTo: z.string().datetime().optional().nullable(),
  })
  .superRefine((value, context) => {
    if (value.scope !== "GLOBAL" && !value.scopeId)
      context.addIssue({ code: "custom", path: ["scopeId"], message: "scope_id_required" });
    if (value.scope === "GLOBAL" && value.scopeId)
      context.addIssue({ code: "custom", path: ["scopeId"], message: "global_scope_has_no_id" });
    if (value.type === "FIXED" && !/^\d+$/.test(value.value))
      context.addIssue({ code: "custom", path: ["value"], message: "fixed_dirams_integer" });
  });
export async function listPricingRules() {
  const db = await getDb();
  return db.select().from(pricingRules).orderBy(desc(pricingRules.priority));
}
export async function createPricingRule(_actor: SessionUser, _input: unknown, _ip?: string) {
  void _actor;
  void _input;
  void _ip;
  throw new ApiError(410, "product_pricing_required", "Укажите наценку в карточке товара");
}
export async function deletePricingRule(actor: SessionUser, id: string, ip?: string) {
  const db = await getDb();
  const [deleted] = await db.delete(pricingRules).where(eq(pricingRules.id, id)).returning();
  if (!deleted) throw new ApiError(404, "not_found", "Правило не найдено");
  await writeAudit(db, {
    actorUserId: actor.id,
    actorRole: actor.role,
    action: "pricing_rule.deleted",
    entity: "pricing_rules",
    entityId: id,
    data: { before: { scope: deleted.scope, value: deleted.value } },
    ip,
  });
  return { ok: true };
}
export async function previewPrice(input: unknown) {
  const data = z
    .object({
      productId: z.string().uuid(),
      supplierId: z.string().uuid(),
      categoryId: z.string().uuid(),
      supplierPriceDirams: z.string().regex(/^\d+$/),
    })
    .parse(await Promise.resolve(input));
  const [product] = await (
    await getDb()
  )
    .select()
    .from(products)
    .where(eq(products.id, data.productId));
  if (!product) throw new ApiError(404, "not_found", "Товар не найден");
  const customerPriceDirams = calculateCustomerPrice({
    ...data,
    markupPercent: product.markupPercent,
    supplierPriceDirams: BigInt(data.supplierPriceDirams),
  });
  return {
    supplierPriceDirams: data.supplierPriceDirams,
    markupDirams: (customerPriceDirams - BigInt(data.supplierPriceDirams)).toString(),
    customerPriceDirams: customerPriceDirams.toString(),
  };
}

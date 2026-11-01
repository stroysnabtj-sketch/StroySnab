import { getDb, type DbExecutor } from "@/db";
import { pricingRules } from "@/db/schema";
export type PricedOffer = { productId: string; supplierId: string; categoryId: string; supplierPriceDirams: bigint };
type Rule = typeof pricingRules.$inferSelect;
async function activeRules(db: DbExecutor) { const now = Date.now(); return (await db.select().from(pricingRules)).filter((rule) => (!rule.activeFrom || rule.activeFrom.getTime() <= now) && (!rule.activeTo || rule.activeTo.getTime() > now)); }
function calculateWithRules(offer: PricedOffer, rules: Rule[]) {
  const applicable = rules.filter((rule) => (rule.scope === "PRODUCT" && rule.scopeId === offer.productId) || (rule.scope === "SUPPLIER" && rule.scopeId === offer.supplierId) || (rule.scope === "CATEGORY" && rule.scopeId === offer.categoryId) || rule.scope === "GLOBAL");
  const rank = { GLOBAL: 0, CATEGORY: 1, SUPPLIER: 2, PRODUCT: 3 } as const;
  applicable.sort((a, b) => rank[a.scope as keyof typeof rank] - rank[b.scope as keyof typeof rank] || a.priority - b.priority);
  const rule = applicable.at(-1); if (!rule) return offer.supplierPriceDirams + offer.supplierPriceDirams / 10n;
  if (rule.type === "FIXED") return offer.supplierPriceDirams + BigInt(rule.value);
  if (!/^\d+(?:\.\d{1,4})?$/.test(rule.value)) return offer.supplierPriceDirams;
  const [whole, fraction = ""] = rule.value.split(".");
  const basisPoints = BigInt(whole) * 10000n + BigInt(fraction.padEnd(4, "0"));
  return offer.supplierPriceDirams + (offer.supplierPriceDirams * basisPoints) / 1000000n;
}
export async function calculateCustomerPrice(offer: PricedOffer, db?: DbExecutor): Promise<bigint> { const database = db ?? await getDb(); return calculateWithRules(offer, await activeRules(database)); }
export async function priceOffers<T extends PricedOffer>(offers: T[], db?: DbExecutor): Promise<(T & { customerPriceDirams: bigint })[]> { const database = db ?? await getDb(); const rules = await activeRules(database); return offers.map((offer) => ({ ...offer, customerPriceDirams: calculateWithRules(offer, rules) })); }

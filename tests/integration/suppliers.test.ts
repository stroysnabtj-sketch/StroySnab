import { afterAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { closeDb, getDb } from "@/db";
import { supplierInvitations, supplierOffers, supplierUsers, users } from "@/db/schema";
import type { SessionUser } from "@/modules/auth/session";
import { getPublicProduct } from "@/modules/catalog/service";
import { calculateCustomerPrice } from "@/modules/pricing/service";
import { createPricingRule, deletePricingRule } from "@/modules/pricing/admin-service";
import { acceptInvitation, createInvitation, getSupplierForUser } from "@/modules/suppliers/service";
import { listOffers, updateOffer } from "@/modules/suppliers/offer-service";

afterAll(async () => { await closeDb(); });
async function actor(email: string): Promise<SessionUser> { const db = await getDb(); const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1); return { id: user.id, email: user.email, phone: user.phone, role: user.role as SessionUser["role"] }; }
describe("supplier isolation and pricing", () => {
  it("prevents supplier A from reading or mutating supplier B offers", async () => {
    const userA = await actor("seller@stroyhub.tj"); const membershipA = await getSupplierForUser(userA.id);
    const own = await listOffers(membershipA.supplier.id);
    expect(own.length).toBeGreaterThan(0); expect(own.every((offer) => offer.supplierId === membershipA.supplier.id)).toBe(true);
    const all = await listOffers(); const foreign = all.find((offer) => offer.supplierId !== membershipA.supplier.id)!;
    await expect(updateOffer(userA, foreign.id, membershipA.supplier.id, { stockQty: "999" }, "test")).rejects.toMatchObject({ status: 404 });
    const db = await getDb(); const [unchanged] = await db.select().from(supplierOffers).where(eq(supplierOffers.id, foreign.id)); expect(unchanged.stockQty).toBe(foreign.stockQty);
  });
  it("reflects procurement price changes publicly without leaking them", async () => {
    const admin = await actor("admin@stroyhub.tj"); const [offer] = await listOffers(); const original = offer.supplierPriceDirams;
    await updateOffer(admin, offer.id, offer.supplierId, { supplierPriceDirams: "10000" }, "test");
    const db = await getDb(); const [product] = await db.select({ slug: (await import("@/db/schema")).products.slug }).from((await import("@/db/schema")).products).where(eq((await import("@/db/schema")).products.id, offer.productId));
    const publicProduct = await getPublicProduct(product.slug); const publicOffer = publicProduct!.offers.find((item) => item.id === offer.id)!;
    expect(publicOffer.priceDirams).toBe("11000"); expect(publicOffer).not.toHaveProperty("supplierPriceDirams");
    await updateOffer(admin, offer.id, offer.supplierId, { supplierPriceDirams: original }, "test");
  }, 20000);
  it("supports exact fractional percentage rules", async () => {
    const admin = await actor("admin@stroyhub.tj"); const [offer] = await listOffers(); const db = await getDb(); const product = await db.query.products.findFirst({ where: (table, { eq }) => eq(table.id, offer.productId) });
    const lowerPriority = await createPricingRule(admin, { scope: "PRODUCT", scopeId: offer.productId, type: "PERCENT", value: "3", priority: 1 }, "test");
    const rule = await createPricingRule(admin, { scope: "PRODUCT", scopeId: offer.productId, type: "PERCENT", value: "2.5", priority: 100 }, "test");
    const price = await calculateCustomerPrice({ productId: offer.productId, supplierId: offer.supplierId, categoryId: product!.categoryId, supplierPriceDirams: 10001n });
    expect(price).toBe(10251n); await deletePricingRule(admin, rule.id, "test"); await deletePricingRule(admin, lowerPriority.id, "test");
  });
  it("creates a single-use supplier invitation", async () => {
    const admin = await actor("admin@stroyhub.tj"); const membership = await getSupplierForUser((await actor("seller@stroyhub.tj")).id); const invitation = await createInvitation(admin, membership.supplier.id, "test"); const suffix = Date.now().toString().slice(-7);
    await acceptInvitation({ code: invitation.code, phone: `93${suffix}`, email: `invited${suffix}@example.com`, password: "Invited123!" }, "test");
    const db = await getDb(); const [member] = await db.select().from(supplierUsers).innerJoin(users, eq(supplierUsers.userId, users.id)).where(and(eq(users.email, `invited${suffix}@example.com`), eq(supplierUsers.supplierId, membership.supplier.id)));
    expect(member.supplier_users.role).toBe("STAFF");
    await expect(acceptInvitation({ code: invitation.code, phone: `93${suffix}`, email: `invited${suffix}@example.com`, password: "Invited123!" }, "test")).rejects.toMatchObject({ status: 404 });
    await db.delete(users).where(eq(users.email, `invited${suffix}@example.com`)); await db.delete(supplierInvitations).where(eq(supplierInvitations.id, invitation.id));
  }, 20000);
});

import { afterAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { closeDb, getDb } from "@/db";
import { products, supplierInvitations, supplierOffers, supplierUsers, users } from "@/db/schema";
import type { SessionUser } from "@/modules/auth/session";
import { getPublicProduct } from "@/modules/catalog/service";
import { calculateCustomerPrice } from "@/modules/pricing/service";
import {
  acceptInvitation,
  createInvitation,
  getSupplierForUser,
} from "@/modules/suppliers/service";
import { listOffers, updateOffer } from "@/modules/suppliers/offer-service";

afterAll(async () => {
  await closeDb();
});
async function actor(email: string): Promise<SessionUser> {
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role as SessionUser["role"],
  };
}
describe("supplier isolation and pricing", () => {
  it("prevents supplier A from reading or mutating supplier B offers", async () => {
    const userA = await actor("seller@stroyhub.tj");
    const membershipA = await getSupplierForUser(userA.id);
    const own = await listOffers(membershipA.supplier.id);
    expect(own.length).toBeGreaterThan(0);
    expect(own.every((offer) => offer.supplierId === membershipA.supplier.id)).toBe(true);
    const all = await listOffers();
    const foreign = all.find((offer) => offer.supplierId !== membershipA.supplier.id)!;
    await expect(
      updateOffer(userA, foreign.id, membershipA.supplier.id, { stockQty: "999" }, "test"),
    ).rejects.toMatchObject({ status: 404 });
    const db = await getDb();
    const [unchanged] = await db
      .select()
      .from(supplierOffers)
      .where(eq(supplierOffers.id, foreign.id));
    expect(unchanged.stockQty).toBe(foreign.stockQty);
  });
  it("reflects procurement price changes publicly without leaking them", async () => {
    const admin = await actor("admin@stroyhub.tj");
    const db = await getDb();
    const candidates = await listOffers();
    let offer: (typeof candidates)[number] | undefined;
    let productSlug = "";
    let originalMarkup = "5";
    for (const candidate of candidates) {
      if (candidate.isActive !== "true") continue;
      const [row] = await db
        .select({ slug: products.slug, markupPercent: products.markupPercent })
        .from(products)
        .where(eq(products.id, candidate.productId));
      if (!row) continue;
      const pub = await getPublicProduct(row.slug, false);
      if (pub?.offers.some((item) => item.id === candidate.id)) {
        offer = candidate;
        productSlug = row.slug;
        originalMarkup = row.markupPercent;
        break;
      }
    }
    if (!offer) throw new Error("Expected at least one active public offer");
    const original = offer.supplierPriceDirams;
    try {
      if (Number(originalMarkup) !== 5) {
        await db.update(products).set({ markupPercent: "5" }).where(eq(products.id, offer.productId));
      }
      await updateOffer(admin, offer.id, offer.supplierId, { supplierPriceDirams: "10000" }, "test");
      const publicProduct = await getPublicProduct(productSlug, false);
      const publicOffer = publicProduct!.offers.find((item) => item.id === offer.id)!;
      expect(publicOffer.priceDirams).toBe("10500");
      expect(publicOffer).not.toHaveProperty("supplierPriceDirams");
    } finally {
      await updateOffer(admin, offer.id, offer.supplierId, { supplierPriceDirams: original }, "test");
      if (Number(originalMarkup) !== 5) {
        await db
          .update(products)
          .set({ markupPercent: originalMarkup })
          .where(eq(products.id, offer.productId));
      }
    }
  }, 20000);
  it("uses the published 5% display rate for product price estimates", async () => {
    const [offer] = await listOffers();
    const db = await getDb();
    const product = await db.query.products.findFirst({
      where: (table, { eq }) => eq(table.id, offer.productId),
    });
    const price = calculateCustomerPrice({
      productId: offer.productId,
      supplierId: offer.supplierId,
      categoryId: product!.categoryId,
      supplierPriceDirams: 10001n,
    });
    expect(price).toBe(10501n);
  });
  it("creates a single-use supplier invitation", async () => {
    const admin = await actor("admin@stroyhub.tj");
    const membership = await getSupplierForUser((await actor("seller@stroyhub.tj")).id);
    const invitation = await createInvitation(admin, membership.supplier.id, "test");
    const suffix = Date.now().toString().slice(-7);
    await acceptInvitation(
      {
        code: invitation.code,
        phone: `93${suffix}`,
        email: `invited${suffix}@example.com`,
        password: "Invited123!",
      },
      "test",
    );
    const db = await getDb();
    const [member] = await db
      .select()
      .from(supplierUsers)
      .innerJoin(users, eq(supplierUsers.userId, users.id))
      .where(
        and(
          eq(users.email, `invited${suffix}@example.com`),
          eq(supplierUsers.supplierId, membership.supplier.id),
        ),
      );
    expect(member.supplier_users.role).toBe("STAFF");
    await expect(
      acceptInvitation(
        {
          code: invitation.code,
          phone: `93${suffix}`,
          email: `invited${suffix}@example.com`,
          password: "Invited123!",
        },
        "test",
      ),
    ).rejects.toMatchObject({ status: 404 });
    await db.delete(users).where(eq(users.email, `invited${suffix}@example.com`));
    await db.delete(supplierInvitations).where(eq(supplierInvitations.id, invitation.id));
  }, 20000);
});

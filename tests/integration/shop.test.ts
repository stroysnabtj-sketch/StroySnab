import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "@/db";
import {
  categories,
  orderItems,
  orders,
  products,
  supplierOffers,
  supplierUsers,
  suppliers,
  users,
} from "@/db/schema";
import type { SessionUser } from "@/modules/auth/session";
import {
  createShopProduct,
  getShopProduct,
  listShopProducts,
  updateShopProduct,
  getShopOrder,
  listShopOrders,
  uploadShopImage,
} from "@/modules/suppliers/shop-service";

afterAll(closeDb);
describe("shop product ownership and moderation", () => {
  it("scopes creation and editing to membership and never publishes submitted content", async () => {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.email, "seller@stroyhub.tj"));
    const actor: SessionUser = { ...user, role: "SUPPLIER_OWNER" };
    const [member] = await db.select().from(supplierUsers).where(eq(supplierUsers.userId, user.id));
    const categoryRows = await db.select().from(categories);
    const category = categoryRows.find(
      (row) => !categoryRows.some((child) => child.parentId === row.id),
    )!;
    const [otherShop] = await db
      .insert(suppliers)
      .values({ name: "Другой магазин", phone: "992900000001" })
      .returning();
    const input = {
      product: {
        nameRu: "Проверка магазина",
        categoryId: category.id,
        unit: "шт.",
        attributes: [],
      },
      offer: { supplierPriceDirams: "12345", stockQty: "10", minOrderQty: "1", leadTimeDays: 2 },
      supplierId: otherShop.id,
      status: "ACTIVE",
    };
    const parentCategory = categoryRows.find((row) =>
      categoryRows.some((child) => child.parentId === row.id),
    )!;
    await expect(
      createShopProduct(actor, {
        ...input,
        product: { ...input.product, categoryId: parentCategory.id },
      }),
    ).rejects.toThrow("конечную товарную группу");
    const created = await createShopProduct(actor, input);
    expect(created.product.status).toBe("PENDING");
    expect(created.product.createdBySupplierId).toBe(member.supplierId);
    expect(created.offer?.supplierId).toBe(member.supplierId);
    await updateShopProduct(actor, created.product.id, {
      offer: { ...input.offer, stockQty: "9" },
    });
    expect((await getShopProduct(actor, created.product.id)).offer?.stockQty).toBe("9");
    const [foreign] = await db
      .insert(products)
      .values({
        nameRu: "Чужой",
        sku: crypto.randomUUID(),
        slug: crypto.randomUUID(),
        categoryId: category.id,
        unit: "шт.",
        createdBySupplierId: otherShop.id,
      })
      .returning();
    await expect(getShopProduct(actor, foreign.id)).rejects.toMatchObject({ status: 404 });
    await expect(updateShopProduct(actor, foreign.id, input)).rejects.toMatchObject({
      status: 404,
    });
    expect((await listShopProducts(actor)).some((row) => row.product.id === foreign.id)).toBe(
      false,
    );
    await db.update(products).set({ status: "ACTIVE" }).where(eq(products.id, created.product.id));
    expect(
      (
        await updateShopProduct(actor, created.product.id, {
          product: { ...input.product, nameRu: "Обновлённое название" },
        })
      ).product.status,
    ).toBe("PENDING");
    await expect(
      uploadShopImage(actor, foreign.id, new File(["bad"], "image.png", { type: "image/png" })),
    ).rejects.toMatchObject({ status: 404 });
    await db.insert(supplierOffers).values({
      productId: created.product.id,
      supplierId: otherShop.id,
      supplierPriceDirams: 100n,
    });
    await expect(
      uploadShopImage(
        actor,
        created.product.id,
        new File(["bad"], "image.png", { type: "image/png" }),
      ),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      updateShopProduct(actor, created.product.id, { product: input.product }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(getShopOrder(actor, crypto.randomUUID())).rejects.toMatchObject({ status: 404 });
    await db.delete(products).where(eq(products.id, created.product.id));
    await db.delete(products).where(eq(products.id, foreign.id));
    await db.delete(suppliers).where(eq(suppliers.id, otherShop.id));
  });
  it("shows each shop only its order lines and hides unrelated orders", async () => {
    const db = await getDb();
    const [userA] = await db.select().from(users).where(eq(users.email, "seller@stroyhub.tj"));
    const [userB] = await db.select().from(users).where(eq(users.email, "seller2@stroyhub.tj"));
    const actorA: SessionUser = { ...userA, role: "SUPPLIER_OWNER" };
    const actorB: SessionUser = { ...userB, role: "SUPPLIER_STAFF" };
    const [memberA] = await db
      .select()
      .from(supplierUsers)
      .where(eq(supplierUsers.userId, userA.id));
    const [memberB] = await db
      .select()
      .from(supplierUsers)
      .where(eq(supplierUsers.userId, userB.id));
    const [offerA] = await db
      .select()
      .from(supplierOffers)
      .where(eq(supplierOffers.supplierId, memberA.supplierId));
    const [offerB] = await db
      .select()
      .from(supplierOffers)
      .where(eq(supplierOffers.supplierId, memberB.supplierId));
    const [order] = await db
      .insert(orders)
      .values({
        orderNumber: `TEST-SHOP-${crypto.randomUUID()}`,
        customerName: "Получатель",
        customerPhone: "992900000001",
        deliveryAddress: "Проверочный адрес",
      })
      .returning();
    await db.insert(orderItems).values([
      {
        orderId: order.id,
        offerId: offerA.id,
        productId: offerA.productId,
        productName: "Позиция A",
        sku: "A",
        qty: "1",
        priceDirams: "100",
        subtotalDirams: "100",
      },
      {
        orderId: order.id,
        offerId: offerB.id,
        productId: offerB.productId,
        productName: "Позиция B",
        sku: "B",
        qty: "2",
        priceDirams: "200",
        subtotalDirams: "400",
      },
    ]);
    const ownA = await getShopOrder(actorA, order.id);
    const ownB = await getShopOrder(actorB, order.id);
    expect(ownA.items.map((item) => item.sku)).toEqual(["A"]);
    expect(ownB.items.map((item) => item.sku)).toEqual(["B"]);
    expect(ownA).not.toHaveProperty("totalDirams");
    const [unrelated] = await db
      .insert(orders)
      .values({
        orderNumber: `TEST-SHOP-${crypto.randomUUID()}`,
        customerName: "Другой",
        customerPhone: "992900000002",
        deliveryAddress: "Скрытый адрес",
      })
      .returning();
    await db.insert(orderItems).values({
      orderId: unrelated.id,
      offerId: offerB.id,
      productName: "Только B",
      sku: "B",
      qty: "1",
      priceDirams: "100",
      subtotalDirams: "100",
    });
    await expect(getShopOrder(actorA, unrelated.id)).rejects.toMatchObject({ status: 404 });
    expect((await listShopOrders(actorA)).some((item) => item.id === unrelated.id)).toBe(false);
    await db.delete(orders).where(eq(orders.id, order.id));
    await db.delete(orders).where(eq(orders.id, unrelated.id));
  });
});

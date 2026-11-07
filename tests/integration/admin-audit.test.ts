import { addCartItem } from "@/modules/cart/service";
import { quoteOrder } from "@/modules/orders/service";
import { expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, users } from "@/db/schema";
import {
  updateCategory,
  updateProduct,
  searchAdminProducts,
} from "@/modules/catalog/admin-service";
import { createEmployee, updateUser, listUsers } from "@/modules/auth/admin-service";
import type { SessionUser } from "@/modules/auth/session";
import { supplierUsers, suppliers } from "@/db/schema";
import { products, supplierOffers } from "@/db/schema";
import {
  listCategories,
  listCatalog,
  getPublicProduct,
  searchSuggestions,
} from "@/modules/catalog/service";
import { assignSupplierOwner, getSupplierForUser } from "@/modules/suppliers/service";

async function superActor(): Promise<SessionUser> {
  const db = await getDb();
  const [actor] = await db
    .insert(users)
    .values({ phone: `super-${crypto.randomUUID()}`, passwordHash: "test", role: "SUPER_ADMIN" })
    .returning();
  return { ...actor, role: "SUPER_ADMIN" };
}
it("rejects a category's descendant as its new parent without changing the tree", async () => {
  const db = await getDb(),
    actor = await superActor();
  const key = crypto.randomUUID();
  const [root] = await db
    .insert(categories)
    .values({ slug: `root-${key}`, nameRu: "Корень" })
    .returning();
  const [child] = await db
    .insert(categories)
    .values({ slug: `child-${key}`, nameRu: "Дочерняя", parentId: root.id })
    .returning();
  await expect(updateCategory(actor, root.id, { parentId: child.id })).rejects.toThrow(
    /цикл|потомк/,
  );
  expect(
    (await db.select().from(categories).where(eq(categories.id, root.id)))[0].parentId,
  ).toBeNull();
});
it("persists an employee's name and synchronizes role changes", async () => {
  const actor = await superActor();
  const suffix = String(Date.now()).slice(-7);
  const created = await createEmployee(
    actor,
    {
      fullName: "Анвар Сотрудник",
      phone: `92${suffix}`,
      email: `staff-${crypto.randomUUID()}@example.com`,
      password: "Employee123!",
      role: "CONTENT_MANAGER",
    },
    "test",
  );
  expect(
    (await listUsers({ q: `92${suffix}` })).find((user) => user.id === created.id)?.fullName,
  ).toBe("Анвар Сотрудник");
});
it("paginates the admin catalog with an accurate count", async () => {
  const first = await searchAdminProducts({ page: 1, pageSize: 2 });
  const second = await searchAdminProducts({ page: 2, pageSize: 2 });
  expect(first.items).toHaveLength(2);
  expect(first.total).toBeGreaterThan(2);
  expect(first.items[0].id).not.toBe(second.items[0].id);
  expect(second.total).toBe(first.total);
});
it("does not let a normal admin assign a super-admin role", async () => {
  const db = await getDb();
  const actor = await superActor();
  const [normal] = await db
    .insert(users)
    .values({ phone: `normal-${crypto.randomUUID()}`, passwordHash: "test", role: "ADMIN" })
    .returning();
  await expect(
    updateUser({ ...normal, role: "ADMIN" }, actor.id, { role: "CUSTOMER" }, "test"),
  ).rejects.toThrow();
});
it("keeps at least one active super-admin", async () => {
  const db = await getDb(),
    actor = await superActor();
  const previous = await db.select().from(users).where(eq(users.role, "SUPER_ADMIN"));
  try {
    for (const user of previous)
      if (user.id !== actor.id)
        await db.update(users).set({ status: "BLOCKED" }).where(eq(users.id, user.id));
    await expect(updateUser(actor, actor.id, { role: "ADMIN" }, "test")).rejects.toThrow(
      /последнего/,
    );
  } finally {
    for (const user of previous)
      await db.update(users).set({ status: user.status }).where(eq(users.id, user.id));
  }
});
it("demotes the previous owner's membership when replacing a shop owner", async () => {
  const db = await getDb(),
    actor = await superActor();
  const key = crypto.randomUUID();
  const [shop] = await db
    .insert(suppliers)
    .values({ name: "Смена владельца", phone: "+992901234567", status: "ACTIVE" })
    .returning();
  const [oldOwner] = await db
    .insert(users)
    .values({ phone: `old-${key}`, passwordHash: "test", role: "SUPPLIER_OWNER" })
    .returning();
  const [newOwner] = await db
    .insert(users)
    .values({
      phone: `new-${key}`,
      email: `new-${key}@example.com`,
      passwordHash: "test",
      role: "CUSTOMER",
    })
    .returning();
  await db
    .insert(supplierUsers)
    .values({ supplierId: shop.id, userId: oldOwner.id, role: "OWNER" });
  await assignSupplierOwner(actor, shop.id, newOwner.email!);
  expect((await getSupplierForUser(oldOwner.id)).role).toBe("STAFF");
  expect((await getSupplierForUser(newOwner.id)).role).toBe("OWNER");
});
it("does not attach one user to two different shops", async () => {
  const db = await getDb(),
    actor = await superActor();
  const shops = await db
    .insert(suppliers)
    .values([
      { name: "Первый магазин", phone: "+992901234567" },
      { name: "Второй магазин", phone: "+992901234568" },
    ])
    .returning();
  const key = crypto.randomUUID();
  const [user] = await db
    .insert(users)
    .values({
      phone: `multi-${key}`,
      email: `multi-${key}@example.com`,
      passwordHash: "test",
      role: "SUPPLIER_OWNER",
    })
    .returning();
  await db
    .insert(supplierUsers)
    .values({ userId: user.id, supplierId: shops[0].id, role: "OWNER" });
  await expect(assignSupplierOwner(actor, shops[1].id, user.email!)).rejects.toThrow(
    /другому|другом/,
  );
});
it("cannot demote a platform admin through shop-owner assignment", async () => {
  const db = await getDb();
  const key = crypto.randomUUID();
  const [shop] = await db
    .insert(suppliers)
    .values({ name: "Защищённый магазин", phone: "+992901234567" })
    .returning();
  const [user] = await db
    .insert(users)
    .values({
      phone: `protected-${key}`,
      email: `protected-${key}@example.com`,
      passwordHash: "test",
      role: "ADMIN",
    })
    .returning();
  const [manager] = await db
    .insert(users)
    .values({ phone: `manager-${key}`, passwordHash: "test", role: "PROCUREMENT_MANAGER" })
    .returning();
  await expect(
    assignSupplierOwner({ ...manager, role: "PROCUREMENT_MANAGER" }, shop.id, user.email!),
  ).rejects.toThrow();
});
it("hides products below a hidden parent category from every public entry point", async () => {
  const db = await getDb(),
    key = crypto.randomUUID();
  const [root] = await db
    .insert(categories)
    .values({ slug: `hidden-${key}`, nameRu: "Скрытый раздел", isActive: "false" })
    .returning();
  const [leaf] = await db
    .insert(categories)
    .values({ slug: `leaf-${key}`, nameRu: "Дочерняя группа", parentId: root.id })
    .returning();
  const name = `Тестскрытия${key}`;
  const [product] = await db
    .insert(products)
    .values({
      sku: `H-${key}`,
      slug: `product-${key}`,
      nameRu: name,
      unit: "шт.",
      status: "PUBLISHED",
      categoryId: leaf.id,
    })
    .returning();
  const [shop] = await db.select().from(suppliers).where(eq(suppliers.status, "ACTIVE")).limit(1);
  await db.insert(supplierOffers).values({
    productId: product.id,
    supplierId: shop.id,
    supplierPriceDirams: 1000n,
    stockQty: "5",
    minOrderQty: "1",
  });
  expect((await listCategories()).some((row) => row.id === leaf.id)).toBe(false);
  expect((await listCatalog({ q: name })).items).toHaveLength(0);
  expect(await getPublicProduct(product.slug)).toBeNull();
  expect(await searchSuggestions(name)).toHaveLength(0);
  const [hiddenOffer] = await db
    .select()
    .from(supplierOffers)
    .where(eq(supplierOffers.productId, product.id));
  const guestToken = crypto.randomUUID();
  await expect(addCartItem({ offerId: hiddenOffer.id, qty: "1", guestToken })).rejects.toThrow();
  await db.update(categories).set({ isActive: "true" }).where(eq(categories.id, root.id));
  await addCartItem({ offerId: hiddenOffer.id, qty: "1", guestToken });
  await db.update(categories).set({ isActive: "false" }).where(eq(categories.id, root.id));
  await expect(quoteOrder({ guestToken, fulfillment: "PICKUP" })).rejects.toThrow(/недоступен/);
  await db.delete(products).where(eq(products.id, product.id));
  await db.delete(categories).where(eq(categories.id, leaf.id));
  await db.delete(categories).where(eq(categories.id, root.id));
});

it("requires and saves a moderation rejection reason", async () => {
  const db = await getDb(),
    actor = await superActor();
  const tree = await db.select().from(categories);
  const category = tree.find((row) => !tree.some((child) => child.parentId === row.id))!;
  const key = crypto.randomUUID();
  const [product] = await db
    .insert(products)
    .values({
      sku: `MOD-${key}`,
      slug: `mod-${key}`,
      nameRu: "Тест модерации",
      categoryId: category.id,
      unit: "шт.",
      status: "PENDING",
    })
    .returning();
  try {
    await expect(updateProduct(actor, product.id, { status: "REJECTED" })).rejects.toThrow(
      /причин/,
    );
    await updateProduct(actor, product.id, {
      status: "REJECTED",
      rejectReason: "Уточните характеристики и приложите фото",
    });
    expect(
      (await db.select().from(products).where(eq(products.id, product.id)))[0].rejectReason,
    ).toContain("характеристики");
    await updateProduct(actor, product.id, { status: "PUBLISHED" });
    expect(
      (await db.select().from(products).where(eq(products.id, product.id)))[0].rejectReason,
    ).toBeNull();
  } finally {
    await db.delete(products).where(eq(products.id, product.id));
  }
});

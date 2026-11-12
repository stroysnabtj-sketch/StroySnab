import { publicProductText } from "@/modules/catalog/public-text";
import { sql } from "drizzle-orm";
import { visibleCategoryIds } from "@/modules/catalog/category-visibility";
import { createHash, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { carts, cartItems, customers, products, supplierOffers, suppliers } from "@/db/schema";
import { optionalUser } from "@/modules/auth/session";
import { calculateOrderMarkup, lineBase, quantityMillis } from "@/modules/pricing/order-markup";
import { ApiError } from "@/server/api-error";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
function stockMillis(value: string) {
  if (!/^\d+(?:\.\d{1,3})?$/.test(value))
    throw new ApiError(409, "invalid_stock", "Остаток требует проверки");
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, "0"));
}
async function identity(userId?: string, guestToken?: string) {
  const db = await getDb();
  let customerId: string | null = null;
  if (userId) {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, userId))
      .limit(1);
    customerId = customer?.id ?? null;
  }
  return { db, customerId, tokenHash: !customerId && guestToken ? hash(guestToken) : null };
}
async function findCart(userId?: string, guestToken?: string) {
  const { db, customerId, tokenHash } = await identity(userId, guestToken);
  const condition = customerId
    ? eq(carts.customerId, customerId)
    : tokenHash
      ? eq(carts.sessionTokenHash, tokenHash)
      : null;
  const cart = condition ? (await db.select().from(carts).where(condition).limit(1))[0] : null;
  return { db, cart, customerId, tokenHash };
}
export async function addCartItem(input: {
  offerId: string;
  qty: string;
  userId?: string;
  guestToken?: string;
}) {
  const qty = quantityMillis(input.qty);
  const { db, cart, customerId } = await findCart(input.userId, input.guestToken);
  const nextGuestToken =
    !customerId && !input.guestToken ? randomBytes(32).toString("base64url") : null;
  const tokenHash = nextGuestToken ? hash(nextGuestToken) : null;
  const item = await db.transaction(async (tx) => {
    const [offerRow] = await tx
      .select({ offer: supplierOffers })
      .from(supplierOffers)
      .innerJoin(products, eq(supplierOffers.productId, products.id))
      .innerJoin(suppliers, eq(supplierOffers.supplierId, suppliers.id))
      .where(
        and(
          eq(supplierOffers.id, input.offerId),
          eq(supplierOffers.isActive, "true"),
          eq(products.status, "PUBLISHED"),
          sql`${products.categoryId} in (${visibleCategoryIds})`,
          eq(suppliers.status, "ACTIVE"),
        ),
      )
      .limit(1);
    if (!offerRow) throw new ApiError(404, "not_found", "Предложение не найдено");
    let activeCart = cart;
    if (!activeCart) {
      const [created] = await tx
        .insert(carts)
        .values({
          customerId,
          sessionTokenHash: customerId
            ? null
            : (tokenHash ?? (input.guestToken ? hash(input.guestToken) : null)),
        })
        .returning();
      activeCart = created;
    }
    const [existing] = await tx
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, activeCart.id), eq(cartItems.offerId, input.offerId)))
      .limit(1);
    const total = (existing ? quantityMillis(existing.qty) : 0n) + qty;
    const minOrder = quantityMillis(offerRow.offer.minOrderQty);
    const available =
      stockMillis(offerRow.offer.stockQty) - stockMillis(offerRow.offer.reservedQty);
    if (total < minOrder)
      throw new ApiError(400, "minimum_order", `Минимальный заказ: ${offerRow.offer.minOrderQty}`);
    if (total > available)
      throw new ApiError(409, "out_of_stock", `Доступно только ${offerRow.offer.stockQty}`);
    if (existing) {
      const [updated] = await tx
        .update(cartItems)
        .set({
          qty: `${total / 1000n}.${(total % 1000n).toString().padStart(3, "0")}`.replace(
            /\.000$/,
            "",
          ),
        })
        .where(eq(cartItems.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await tx
      .insert(cartItems)
      .values({
        cartId: activeCart.id,
        offerId: input.offerId,
        qty: `${qty / 1000n}.${(qty % 1000n).toString().padStart(3, "0")}`.replace(/\.000$/, ""),
      })
      .returning();
    return created;
  });
  return { item, guestToken: nextGuestToken };
}
export async function getCart(userId?: string, guestToken?: string) {
  const { db, cart } = await findCart(userId, guestToken);
  if (!cart) return { id: null, items: [], totalDirams: "0", markupPercent: 0 };
  const rows = await db
    .select({ item: cartItems, offer: supplierOffers, product: products })
    .from(cartItems)
    .innerJoin(supplierOffers, eq(cartItems.offerId, supplierOffers.id))
    .innerJoin(products, eq(supplierOffers.productId, products.id))
    .where(eq(cartItems.cartId, cart.id));
  const pricing = calculateOrderMarkup(
    rows.reduce((sum, row) => sum + lineBase(row.offer.supplierPriceDirams, row.item.qty), 0n),
  );
  let allocated = 0n;
  const items = rows.map((row, index) => {
    const base = lineBase(row.offer.supplierPriceDirams, row.item.qty);
    const markup =
      index === rows.length - 1
        ? pricing.markupDirams - allocated
        : (base * BigInt(pricing.percent)) / 100n;
    allocated += markup;
    return {
      id: row.item.id,
      offerId: row.offer.id,
      productName: publicProductText(row.product.nameRu),
      slug: row.product.slug,
      sku: row.product.sku,
      unit: row.product.unit,
      qty: row.item.qty,
      minOrderQty: row.offer.minOrderQty,
      priceDirams: (
        row.offer.supplierPriceDirams +
        (row.offer.supplierPriceDirams * BigInt(pricing.percent)) / 100n
      ).toString(),
      subtotalDirams: (base + markup).toString(),
      stockQty: (Number(row.offer.stockQty) - Number(row.offer.reservedQty)).toString(),
    };
  });
  return {
    id: cart.id,
    items,
    totalDirams: pricing.totalDirams.toString(),
    markupPercent: pricing.percent,
  };
}

export async function getCartCount(userId?: string, guestToken?: string): Promise<number> {
  if (!userId && !guestToken) return 0;
  const { db, cart } = await findCart(userId, guestToken);
  if (!cart) return 0;
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(cartItems)
    .where(eq(cartItems.cartId, cart.id));
  return row.count;
}
export async function updateCartItem(input: {
  itemId: string;
  qty: string;
  userId?: string;
  guestToken?: string;
}) {
  const { db, cart } = await findCart(input.userId, input.guestToken);
  if (!cart) throw new ApiError(404, "not_found", "Корзина не найдена");
  const [owned] = await db
    .select({ item: cartItems, offer: supplierOffers })
    .from(cartItems)
    .innerJoin(supplierOffers, eq(cartItems.offerId, supplierOffers.id))
    .where(and(eq(cartItems.id, input.itemId), eq(cartItems.cartId, cart.id)))
    .limit(1);
  if (!owned) throw new ApiError(404, "not_found", "Позиция не найдена");
  const qtyNumber = Number(input.qty);
  if (!Number.isFinite(qtyNumber) || qtyNumber < 0)
    throw new ApiError(400, "validation_error", "Некорректное количество");
  if (qtyNumber === 0) {
    await db.delete(cartItems).where(eq(cartItems.id, input.itemId));
    return;
  }
  const qty = quantityMillis(input.qty);
  const available = stockMillis(owned.offer.stockQty) - stockMillis(owned.offer.reservedQty);
  if (qty < quantityMillis(owned.offer.minOrderQty))
    throw new ApiError(400, "minimum_order", `Минимальный заказ: ${owned.offer.minOrderQty}`);
  if (qty > available) throw new ApiError(409, "out_of_stock", "Количество превышает остаток");
  await db.update(cartItems).set({ qty: input.qty }).where(eq(cartItems.id, input.itemId));
}
export async function currentUserId() {
  return (await optionalUser())?.id;
}

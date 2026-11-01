import { createHash, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { carts, cartItems, customers, products, supplierOffers, suppliers } from "@/db/schema";
import { optionalUser } from "@/modules/auth/session";
import { priceOffers } from "@/modules/pricing/service";
import { ApiError } from "@/server/api-error";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
async function identity(userId?: string, guestToken?: string) {
  const db = await getDb();
  let customerId: string | null = null;
  if (userId) { const [customer] = await db.select().from(customers).where(eq(customers.userId, userId)).limit(1); customerId = customer?.id ?? null; }
  return { db, customerId, tokenHash: !customerId && guestToken ? hash(guestToken) : null };
}
async function findCart(userId?: string, guestToken?: string) {
  const { db, customerId, tokenHash } = await identity(userId, guestToken);
  const condition = customerId ? eq(carts.customerId, customerId) : tokenHash ? eq(carts.sessionTokenHash, tokenHash) : null;
  const cart = condition ? (await db.select().from(carts).where(condition).limit(1))[0] : null;
  return { db, cart, customerId, tokenHash };
}
export async function addCartItem(input: { offerId: string; qty: string; userId?: string; guestToken?: string }) {
  const qty = Number(input.qty); if (!Number.isFinite(qty) || qty <= 0 || qty > 100000) throw new ApiError(400, "validation_error", "Некорректное количество");
  const { db, cart, customerId } = await findCart(input.userId, input.guestToken);
  const nextGuestToken = !customerId && !input.guestToken ? randomBytes(32).toString("base64url") : null;
  const tokenHash = nextGuestToken ? hash(nextGuestToken) : null;
  const item = await db.transaction(async (tx) => {
    const [offerRow] = await tx.select({ offer: supplierOffers }).from(supplierOffers).innerJoin(products, eq(supplierOffers.productId, products.id)).innerJoin(suppliers, eq(supplierOffers.supplierId, suppliers.id)).where(and(eq(supplierOffers.id, input.offerId), eq(supplierOffers.isActive, "true"), eq(products.status, "PUBLISHED"), eq(suppliers.status, "ACTIVE"))).limit(1);
    if (!offerRow) throw new ApiError(404, "not_found", "Предложение не найдено");
    let activeCart = cart;
    if (!activeCart) { const [created] = await tx.insert(carts).values({ customerId, sessionTokenHash: customerId ? null : tokenHash ?? (input.guestToken ? hash(input.guestToken) : null) }).returning(); activeCart = created; }
    const [existing] = await tx.select().from(cartItems).where(and(eq(cartItems.cartId, activeCart.id), eq(cartItems.offerId, input.offerId))).limit(1);
    const total = Number(existing?.qty ?? 0) + qty; const available = Number(offerRow.offer.stockQty) - Number(offerRow.offer.reservedQty);
    if (total > available) throw new ApiError(409, "out_of_stock", `Доступно только ${available}`);
    if (existing) { const [updated] = await tx.update(cartItems).set({ qty: String(total) }).where(eq(cartItems.id, existing.id)).returning(); return updated; }
    const [created] = await tx.insert(cartItems).values({ cartId: activeCart.id, offerId: input.offerId, qty: String(qty) }).returning(); return created;
  });
  return { item, guestToken: nextGuestToken };
}
export async function getCart(userId?: string, guestToken?: string) {
  const { db, cart } = await findCart(userId, guestToken); if (!cart) return { id: null, items: [], totalDirams: "0" };
  const rows = await db.select({ item: cartItems, offer: supplierOffers, product: products }).from(cartItems).innerJoin(supplierOffers, eq(cartItems.offerId, supplierOffers.id)).innerJoin(products, eq(supplierOffers.productId, products.id)).where(eq(cartItems.cartId, cart.id));
  const priced = await priceOffers(rows.map((row) => ({ ...row.offer, categoryId: row.product.categoryId })), db);
  const items = rows.map((row) => { const offer = priced.find((entry) => entry.id === row.offer.id)!; return { id: row.item.id, offerId: row.offer.id, productName: row.product.nameRu, slug: row.product.slug, sku: row.product.sku, unit: row.product.unit, qty: row.item.qty, priceDirams: offer.customerPriceDirams.toString(), subtotalDirams: (offer.customerPriceDirams * BigInt(Math.round(Number(row.item.qty) * 1000)) / 1000n).toString(), stockQty: (Number(row.offer.stockQty) - Number(row.offer.reservedQty)).toString() }; });
  return { id: cart.id, items, totalDirams: items.reduce((sum, item) => sum + BigInt(item.subtotalDirams), 0n).toString() };
}
export async function updateCartItem(input: { itemId: string; qty: string; userId?: string; guestToken?: string }) {
  const { db, cart } = await findCart(input.userId, input.guestToken); if (!cart) throw new ApiError(404, "not_found", "Корзина не найдена");
  const [owned] = await db.select({ item: cartItems, offer: supplierOffers }).from(cartItems).innerJoin(supplierOffers, eq(cartItems.offerId, supplierOffers.id)).where(and(eq(cartItems.id, input.itemId), eq(cartItems.cartId, cart.id))).limit(1);
  if (!owned) throw new ApiError(404, "not_found", "Позиция не найдена");
  const qty = Number(input.qty); if (!Number.isFinite(qty) || qty < 0) throw new ApiError(400, "validation_error", "Некорректное количество");
  if (qty === 0) { await db.delete(cartItems).where(eq(cartItems.id, input.itemId)); return; }
  if (qty > Number(owned.offer.stockQty) - Number(owned.offer.reservedQty)) throw new ApiError(409, "out_of_stock", "Количество превышает остаток");
  await db.update(cartItems).set({ qty: String(qty) }).where(eq(cartItems.id, input.itemId));
}
export async function currentUserId() { return (await optionalUser())?.id; }

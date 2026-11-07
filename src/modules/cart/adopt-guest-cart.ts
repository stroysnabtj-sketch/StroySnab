import { createHash } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { carts, cartItems, customers } from "@/db/schema";
import { quantityMillis } from "@/modules/pricing/order-markup";

export async function adoptGuestCart(userId: string, guestToken?: string): Promise<boolean> {
  if (!guestToken) return false;
  const tokenHash = createHash("sha256").update(guestToken).digest("hex");
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [customer] = await tx
      .select()
      .from(customers)
      .where(eq(customers.userId, userId))
      .for("update");
    if (!customer) return false;
    const [guest] = await tx
      .select()
      .from(carts)
      .where(and(eq(carts.sessionTokenHash, tokenHash), isNull(carts.customerId)))
      .for("update");
    if (!guest) return false;
    const [owned] = await tx
      .select()
      .from(carts)
      .where(eq(carts.customerId, customer.id))
      .for("update");
    if (!owned) {
      await tx
        .update(carts)
        .set({ customerId: customer.id, sessionTokenHash: null })
        .where(eq(carts.id, guest.id));
      return true;
    }
    const incoming = await tx.select().from(cartItems).where(eq(cartItems.cartId, guest.id));
    for (const item of incoming) {
      const [existing] = await tx
        .select()
        .from(cartItems)
        .where(and(eq(cartItems.cartId, owned.id), eq(cartItems.offerId, item.offerId)));
      const millis = quantityMillis(item.qty) + (existing ? quantityMillis(existing.qty) : 0n);
      const qty = `${millis / 1000n}.${(millis % 1000n).toString().padStart(3, "0")}`;
      quantityMillis(qty);
      await tx
        .insert(cartItems)
        .values({ cartId: owned.id, offerId: item.offerId, qty })
        .onConflictDoUpdate({
          target: [cartItems.cartId, cartItems.offerId],
          set: { qty: sql`${cartItems.qty} + ${item.qty}::numeric` },
        });
    }
    await tx.delete(carts).where(eq(carts.id, guest.id));
    return true;
  });
}

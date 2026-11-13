import { expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { products, supplierOffers, users } from "@/db/schema";
import { updateProduct } from "@/modules/catalog/admin-service";
import { getPublicProduct } from "@/modules/catalog/service";
import { addCartItem, getCart } from "@/modules/cart/service";
import { createOrder, getOrder, quoteOrder, changeOrderStatus } from "@/modules/orders/service";
import { createProcurementRequest, saveQuotation } from "@/modules/procurement/service";
import { productLinePrice } from "@/modules/pricing/product-price";
import type { SessionUser } from "@/modules/auth/session";

it("uses product rates consistently in catalog/cart/order/quotation and preserves issued prices", async () => {
  const db = await getDb();
  const [admin] = await db.select().from(users).where(eq(users.role, "SUPER_ADMIN")).limit(1);
  const actor = { ...admin, role: "SUPER_ADMIN" } as SessionUser;
  const candidates = await db
    .select()
    .from(products)
    .where(eq(products.status, "PUBLISHED"))
    .limit(15);
  const selected: Array<{
    product: typeof products.$inferSelect;
    offer: typeof supplierOffers.$inferSelect;
  }> = [];
  for (const product of candidates) {
    const publicProduct = await getPublicProduct(product.slug, false);
    if (!publicProduct?.offers.length) continue;
    const [offer] = await db
      .select()
      .from(supplierOffers)
      .where(eq(supplierOffers.id, publicProduct.offers[0].id));
    if (Number(offer.minOrderQty) <= 1 && Number(offer.stockQty) - Number(offer.reservedQty) > 3)
      selected.push({ product, offer });
    if (selected.length === 2) break;
  }
  expect(selected).toHaveLength(2);
  const [a, b] = selected;
  let orderId: string | undefined;
  try {
    await updateProduct(actor, a.product.id, { markupPercent: "12.50" });
    await expect(
      updateProduct({ ...actor, role: "CONTENT_MANAGER" }, a.product.id, { markupPercent: "25" }),
    ).rejects.toMatchObject({ status: 403 });
    await updateProduct({ ...actor, role: "CONTENT_MANAGER" }, a.product.id, {
      nameRu: a.product.nameRu,
    });
    await updateProduct(actor, b.product.id, { markupPercent: "0" });
    await expect(updateProduct(actor, a.product.id, { markupPercent: "-1" })).rejects.toThrow();
    const detail = await getPublicProduct(a.product.slug, false);
    const first = productLinePrice(a.offer.supplierPriceDirams, "1.375", "12.50");
    expect(String(detail!.offers[0].priceDirams)).toBe(first.priceDirams.toString());
    expect(detail!.product).not.toHaveProperty("markupPercent");
    const guestToken = crypto.randomUUID();
    await addCartItem({ guestToken, offerId: a.offer.id, qty: "1.375" });
    await addCartItem({ guestToken, offerId: b.offer.id, qty: "1" });
    const cart = await getCart(undefined, guestToken);
    const quote = await quoteOrder({ guestToken, fulfillment: "PICKUP" });
    expect(cart.totalDirams).toBe((first.subtotalDirams + b.offer.supplierPriceDirams).toString());
    expect(quote.totalDirams).toBe(cart.totalDirams);
    const order = await createOrder({
      guestToken,
      idempotencyKey: crypto.randomUUID(),
      expectedTotalDirams: cart.totalDirams,
      customerName: "Проверка цены",
      customerPhone: "+992900001122",
      deliveryCity: "",
      deliveryAddress: "",
      fulfillment: "PICKUP",
      paymentMethod: "CASH_ON_DELIVERY",
    });
    orderId = order.id;
    const request = await createProcurementRequest(
      {
        title: "Проверка наценок",
        contactName: "Покупатель",
        contactPhone: "+992900001122",
        lines: [{ name: a.product.nameRu, qty: "1", unit: a.product.unit }],
      },
      null,
    );
    const quotation = await saveQuotation(request.id, actor, {
      version: 0,
      send: false,
      validUntil: new Date(Date.now() + 86400000).toISOString(),
      deliveryDirams: "0",
      conditions: "",
      lines: [
        {
          name: a.product.nameRu,
          qty: "1.375",
          unit: a.product.unit,
          offerId: a.offer.id,
          basePriceDirams: a.offer.supplierPriceDirams.toString(),
          markupPercent: "999",
        },
        {
          name: "Отдельная позиция",
          qty: "2",
          unit: "шт.",
          basePriceDirams: "10000",
          markupPercent: "15",
        },
      ],
    });
    expect(quotation.lines[0].markupPercent).toBe("12.50");
    expect(quotation.totalDirams).toBe((first.subtotalDirams + 23000n).toString());
    await updateProduct(actor, a.product.id, { markupPercent: "25" });
    expect((await getOrder(order.id, { guestToken }))!.totalDirams).toBe(cart.totalDirams);
  } finally {
    if (orderId)
      await changeOrderStatus(actor, orderId, { status: "CANCELLED", expectedStatus: "NEW" });
    for (const row of selected)
      await db
        .update(products)
        .set({ markupPercent: row.product.markupPercent })
        .where(eq(products.id, row.product.id));
  }
});

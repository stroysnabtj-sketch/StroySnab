import type { DbExecutor } from "@/db";
import { productPrice } from "./product-price";
import { products } from "@/db/schema";
import { inArray } from "drizzle-orm";
export type PricedOffer = {
  productId: string;
  supplierId: string;
  categoryId: string;
  supplierPriceDirams: bigint;
  markupPercent?: string;
};
export function calculateCustomerPrice(offer: PricedOffer): bigint {
  return productPrice(offer.supplierPriceDirams, offer.markupPercent);
}
export async function priceOffers<T extends PricedOffer>(
  offers: T[],
  _db?: DbExecutor,
): Promise<(T & { customerPriceDirams: bigint })[]> {
  const rows =
    _db && offers.length
      ? await _db
          .select({ id: products.id, markupPercent: products.markupPercent })
          .from(products)
          .where(
            inArray(
              products.id,
              offers.map((o) => o.productId),
            ),
          )
      : [];
  const rates = new Map(rows.map((row) => [row.id, row.markupPercent]));
  return offers.map((offer) => ({
    ...offer,
    customerPriceDirams: calculateCustomerPrice({
      ...offer,
      markupPercent: rates.get(offer.productId) ?? offer.markupPercent,
    }),
  }));
}

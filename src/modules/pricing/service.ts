import type { DbExecutor } from "@/db";
export type PricedOffer = {
  productId: string;
  supplierId: string;
  categoryId: string;
  supplierPriceDirams: bigint;
};
// Product pages use the standard rate as an estimate. The final order rate is
// recalculated against the full goods subtotal in the cart and checkout.
export function calculateCustomerPrice(offer: PricedOffer): bigint {
  return offer.supplierPriceDirams + (offer.supplierPriceDirams * 7n) / 100n;
}
export async function priceOffers<T extends PricedOffer>(
  offers: T[],
  _db?: DbExecutor,
): Promise<(T & { customerPriceDirams: bigint })[]> {
  void _db;
  return offers.map((offer) => ({ ...offer, customerPriceDirams: calculateCustomerPrice(offer) }));
}

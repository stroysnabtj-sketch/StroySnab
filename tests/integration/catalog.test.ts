import { afterAll, describe, expect, it } from "vitest";
import { closeDb, getDb } from "@/db";
import { carts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPublicProduct, listCatalog, searchSuggestions } from "@/modules/catalog/service";
import { addCartItem, getCart } from "@/modules/cart/service";
import { calculateCustomerPrice } from "@/modules/pricing/service";
import {
  exportProducts,
  parseProductFile,
  validateImportRows,
} from "@/modules/catalog/import-export";

afterAll(async () => {
  await closeDb();
});
describe("public catalog and pricing", () => {
  it("searches with trigram typo tolerance and never exposes procurement prices", async () => {
    const result = await listCatalog({ q: "цемнт", pageSize: 5 });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0].name).toContain("Цемент");
    const product = await getPublicProduct(result.items[0].slug);
    expect(product).toBeTruthy();
    expect(product!.offers.length).toBeGreaterThan(0);
    expect(product!.offers[0]).not.toHaveProperty("supplierPriceDirams");
    expect(product!.offers[0]).not.toHaveProperty("markup");
    expect(JSON.stringify(product!.offers[0])).not.toContain("margin");
    expect((await searchSuggestions("цемнт")).length).toBeGreaterThan(0);
  }, 20000);
  it("uses the published standard display markup with integer dirams", async () => {
    const price = await calculateCustomerPrice({
      productId: "00000000-0000-0000-0000-000000000000",
      supplierId: "00000000-0000-0000-0000-000000000000",
      categoryId: "00000000-0000-0000-0000-000000000000",
      supplierPriceDirams: 10001n,
    });
    expect(price).toBe(10701n);
  });
  it("round-trips XLSX exports and validates every row", async () => {
    const exported = await exportProducts("xlsx", true);
    const file = new File([new Uint8Array(exported.data)], "template.xlsx");
    expect((await parseProductFile(file)).length).toBe(0);
    const full = await exportProducts("xlsx");
    const rows = await parseProductFile(new File([new Uint8Array(full.data)], "products.xlsx"));
    expect(rows.length).toBeGreaterThanOrEqual(200);
    const validated = await validateImportRows(rows.slice(0, 5));
    expect(validated.every((row) => row.valid)).toBe(true);
  });
  it("persists a guest cart and enforces stock", async () => {
    const result = await listCatalog({ inStock: true, pageSize: 1 });
    const item = result.items[0];
    const token = `vitest-cart-${Date.now()}`;
    await addCartItem({ offerId: item.offerId, qty: "1", guestToken: token });
    const cart = await getCart(undefined, token);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).not.toHaveProperty("supplierPriceDirams");
    await expect(
      addCartItem({ offerId: item.offerId, qty: "100001", guestToken: token }),
    ).rejects.toThrow();
    const db = await getDb();
    if (cart.id) await db.delete(carts).where(eq(carts.id, cart.id));
  });
});

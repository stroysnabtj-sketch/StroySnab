import { afterAll, describe, expect, it } from "vitest";
import { closeDb, getDb } from "@/db";
import { carts, supplierOffers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { strToU8, zipSync } from "fflate";
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
  it("finds products awaiting prices and excludes them from stock and price filters", async () => {
    const result = await listCatalog({ q: "дрел", pageSize: 5 });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0].name).toMatch(/дрел/i);
    const product = await getPublicProduct(result.items[0].slug);
    expect(product).toBeTruthy();
    expect(product!.offers).toHaveLength(0);
    expect(result.items[0]).toMatchObject({ priceDirams: null, offerId: null });
    expect((await listCatalog({ q: "дрел", inStock: true })).items).toHaveLength(0);
    expect((await listCatalog({ q: "дрел", maxPrice: "10000" })).items).toHaveLength(0);
    expect((await searchSuggestions("дрел")).length).toBeGreaterThan(0);
  }, 20000);
  it("uses the published standard display markup with integer dirams", async () => {
    const price = await calculateCustomerPrice({
      productId: "00000000-0000-0000-0000-000000000000",
      supplierId: "00000000-0000-0000-0000-000000000000",
      categoryId: "00000000-0000-0000-0000-000000000000",
      supplierPriceDirams: 10001n,
    });
    expect(price).toBe(10501n);
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
    const db = await getDb();
    const [offer] = await db.select().from(supplierOffers).limit(1);
    const { id: offerId, isActive, stockQty, supplierPriceDirams } = offer;
    await db.update(supplierOffers)
      .set({ isActive: "true", stockQty: "10", supplierPriceDirams: 1000n })
      .where(eq(supplierOffers.id, offerId));
    const token = `vitest-cart-${Date.now()}`;
    try {
      await addCartItem({ offerId, qty: "1", guestToken: token });
      const cart = await getCart(undefined, token);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0]).not.toHaveProperty("supplierPriceDirams");
      await expect(addCartItem({ offerId, qty: "100001", guestToken: token })).rejects.toThrow();
      if (cart.id) await db.delete(carts).where(eq(carts.id, cart.id));
    } finally {
      await db.update(supplierOffers).set({ isActive, stockQty, supplierPriceDirams })
        .where(eq(supplierOffers.id, offerId));
    }
  });
  it("rejects XLSX with oversized worksheets, XML declarations of entities or excess columns", async () => {
    const workbook = (xml: string) =>
      new File(
        [new Uint8Array(zipSync({ "xl/worksheets/sheet1.xml": strToU8(xml) }))],
        "materials.xlsx",
      );
    await expect(
      parseProductFile(workbook("x".repeat(20 * 1024 * 1024 + 1))),
    ).rejects.toMatchObject({ status: 413, code: "file_too_large" });
    await expect(
      parseProductFile(workbook('<!DOCTYPE worksheet [<!ENTITY data "value">]><worksheet/>')),
    ).rejects.toMatchObject({ status: 400, code: "invalid_xlsx" });
    await expect(
      parseProductFile(
        workbook(
          '<worksheet><sheetData><row><c r="XFD1"><v>1</v></c></row></sheetData></worksheet>',
        ),
      ),
    ).rejects.toMatchObject({ status: 400, code: "too_many_columns" });
  });
});

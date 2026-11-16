import { sql } from "drizzle-orm";
import { getDb, closeDb } from "../src/db";
import { productAttributes, products } from "../src/db/schema";
import {
  listCatalog,
  listCategories,
  getPublicProduct,
  searchSuggestions,
} from "../src/modules/catalog/service";
import { formatTJS } from "../src/modules/system/money";
import { translate } from "../src/i18n/storefront";

async function verify() {
  console.log("=== VERIFYING CATALOG ===");

  // 1. Categories
  const categories = await listCategories();
  console.log(`1. listCategories returned ${categories.length} categories.`);
  if (categories.length !== 18) {
    throw new Error(`Expected 18 categories, got ${categories.length}`);
  }

  // 2. All catalog items & 5% markup pricing
  const allResult = await listCatalog({ pageSize: 10 });
  console.log(`2. listCatalog total: ${allResult.total} products.`);
  if (allResult.total !== 1260) {
    throw new Error(`Expected 1260 products, got ${allResult.total}`);
  }
  const sampleProduct = allResult.items[0];
  console.log("Sample product:", {
    sku: sampleProduct.sku,
    name: sampleProduct.name,
    nameTg: sampleProduct.nameTg,
    priceDirams: sampleProduct.priceDirams,
    formattedPrice: formatTJS(sampleProduct.priceDirams),
    brand: sampleProduct.brand,
    imageUrl: sampleProduct.imageUrl,
  });
  if (sampleProduct.priceDirams !== "105") {
    throw new Error(
      `Expected priceDirams to be 105 (1 TJS + 5% markup), got ${sampleProduct.priceDirams}`,
    );
  }

  // 3. Check zero products missing Характеристика
  const db = await getDb();
  const [missingSpec] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(
      sql`not exists (select 1 from ${productAttributes} where ${productAttributes.productId} = ${products.id} and ${productAttributes.name} = 'Характеристика' and length(trim(${productAttributes.value})) > 0)`,
    );
  console.log(`3. Products missing Характеристика: ${missingSpec.count}`);
  if (missingSpec.count !== 0) {
    throw new Error(`Expected 0 products without specs, found ${missingSpec.count}`);
  }

  // 4. Category filtering and facets
  const catResult = await listCatalog({
    category: "akkumulyatornyy-instrument",
    pageSize: 10,
  });
  console.log(`4. Category 'akkumulyatornyy-instrument': ${catResult.total} products.`);
  if (catResult.total !== 55) {
    throw new Error(`Expected 55 cordless tools, got ${catResult.total}`);
  }
  console.log("Facets:", catResult.facets.map((f) => f.label));

  // 5. Attribute filtering
  const typeFilterResult = await listCatalog({
    category: "akkumulyatornyy-instrument",
    attributes: { Тип: "Аккумуляторная ударная дрель" },
  });
  if (typeFilterResult.total <= 0) {
    throw new Error("Expected at least 1 drill matching filter");
  }
  console.log(`5. Filter by Тип='Аккумуляторная ударная дрель': ${typeFilterResult.total} products.`);

  // 6. Search optimization (multi-word + SKU + suggestions)
  const multiWord = await listCatalog({ q: "дрель 21" });
  if (multiWord.total <= 0) {
    throw new Error("Expected multi-word search 'дрель 21' to find products");
  }
  const skuSuggest = await searchSuggestions("SX0602");
  if (!skuSuggest.some((item) => item.sku === "SX0602")) {
    throw new Error("Expected SKU suggestion for SX0602");
  }
  console.log(
    `6. Search 'дрель 21': ${multiWord.total} hits; suggestion for 'SX0602': ${skuSuggest[0]?.name}`,
  );

  // 7. Product detail view
  const detail = await getPublicProduct(sampleProduct.slug);
  if (!detail) throw new Error("Could not load product detail for " + sampleProduct.slug);
  console.log("7. Product detail loaded:", {
    nameRu: detail.product.nameRu,
    nameTg: detail.product.nameTg,
    offersPrice: detail.offers[0]?.priceDirams,
  });
  if (detail.offers[0]?.priceDirams !== "105") {
    throw new Error(`Expected offer priceDirams 105, got ${detail.offers[0]?.priceDirams}`);
  }

  // 8. Tajik translation test
  const tgCat = translate("Аккумуляторный инструмент", "tg");
  const tgType = translate("Тип инструмента", "tg");
  console.log("8. Tajik translations:", { cat: tgCat, type: tgType });

  console.log("\nALL VERIFICATIONS PASSED!");
  await closeDb();
}

verify().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { listCatalog } from "../src/modules/catalog/service";
import { closeDb } from "../src/db";

async function test() {
  const result = await listCatalog({ category: "kirpich" });
  console.log("listCatalog({ category: 'kirpich' }):");
  console.log(" - total:", result.total);
  console.log(" - items length:", result.items.length);
  for (const it of result.items.slice(0, 3)) {
    console.log("   *", it.name, it.priceDirams, it.brand);
  }
  await closeDb();
}
test();


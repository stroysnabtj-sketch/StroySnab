import { getDb, closeDb } from "../src/db";
import { categories, products } from "../src/db/schema";
import { getAllDescendantSlugs } from "../src/modules/catalog/categories-data";
import { eq } from "drizzle-orm";

async function test() {
  const db = await getDb();
  
  // 1. check kirpich category in DB
  const kirpichCats = await db.select().from(categories).where(eq(categories.slug, "kirpich"));
  console.log("kirpich in DB:", kirpichCats);

  // 2. check descendant slugs
  const descSlugs = getAllDescendantSlugs("kirpich");
  console.log("getAllDescendantSlugs('kirpich'):", descSlugs);

  // 3. check all products where name contains кирпич
  const brickProds = await db.select().from(products).where(eq(products.status, "PUBLISHED"));
  const matched = brickProds.filter(p => p.nameRu.toLowerCase().includes("кирпич") || p.slug.includes("brick"));
  console.log(`Total brick products: ${matched.length}`);
  for (const p of matched.slice(0, 5)) {
    console.log(` - ID: ${p.id}, Slug: ${p.slug}, CatID: ${p.categoryId}, Name: ${p.nameRu}`);
  }

  // 4. check if matched product's categoryId is in kirpichCats
  if (kirpichCats.length > 0 && matched.length > 0) {
    const kId = kirpichCats[0].id;
    const sameCat = matched.filter(p => p.categoryId === kId);
    console.log(`Products whose categoryId == kirpichCats[0].id: ${sameCat.length}`);
  }

  await closeDb();
}
test();


import { and, eq } from "drizzle-orm";
import { closeDb, getDb } from "../src/db";
import { categories, products } from "../src/db/schema";
import { legacyCategoryTarget } from "../src/modules/catalog/legacy-taxonomy";
import { REFERENCE_CATEGORY_SLUGS } from "../src/modules/catalog/categories-data";
async function main() {
  const db = await getDb();
  const allCategories = await db.select().from(categories);
  const allProducts = await db
    .select({ id: products.id, name: products.nameRu, categoryId: products.categoryId })
    .from(products);
  const moves: {
    id: string;
    sourceId: string;
    targetId: string;
    source: string;
    target: string;
  }[] = [];
  const unresolved: { id: string; name: string; category: string }[] = [];
  for (const product of allProducts) {
    const source = allCategories.find((c) => c.id === product.categoryId);
    if (!source || REFERENCE_CATEGORY_SLUGS.has(source.slug)) continue;
    const targetSlug = legacyCategoryTarget(source.slug, product.name);
    const target = allCategories.find((c) => c.slug === targetSlug && c.isActive === "true");
    if (target)
      moves.push({
        id: product.id,
        sourceId: source.id,
        targetId: target.id,
        source: source.slug,
        target: target.slug,
      });
    else unresolved.push({ id: product.id, name: product.name, category: source.slug });
  }
  console.log(
    JSON.stringify(
      {
        mode: process.argv.includes("--apply") ? "apply" : "preview",
        totalProducts: allProducts.length,
        moves,
        unresolved,
      },
      null,
      2,
    ),
  );
  if (!process.argv.includes("--apply")) return;
  await db.transaction(async (tx) => {
    for (const move of moves) {
      const changed = await tx
        .update(products)
        .set({ categoryId: move.targetId })
        .where(and(eq(products.id, move.id), eq(products.categoryId, move.sourceId)))
        .returning({ id: products.id });
      if (changed.length !== 1)
        throw new Error("Product category changed during migration; transaction rolled back");
    }
    const occupied = new Set(
      (await tx.select({ categoryId: products.categoryId }).from(products)).map(
        (row) => row.categoryId,
      ),
    );
    const hidden = new Set<string>();
    let changed = true;
    while (changed) {
      changed = false;
      for (const category of allCategories) {
        if (
          REFERENCE_CATEGORY_SLUGS.has(category.slug) ||
          occupied.has(category.id) ||
          hidden.has(category.id)
        )
          continue;
        if (
          allCategories.some(
            (child) =>
              child.parentId === category.id && child.isActive === "true" && !hidden.has(child.id),
          )
        )
          continue;
        await tx
          .update(categories)
          .set({ isActive: "false" })
          .where(eq(categories.id, category.id));
        hidden.add(category.id);
        changed = true;
      }
    }
  });
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => closeDb());

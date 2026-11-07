import { eq } from "drizzle-orm";
import { closeDb, getDb } from "../src/db";
import { categories } from "../src/db/schema";
import { CATEGORIES_TREE } from "../src/modules/catalog/categories-data";

// Metadata only: never generates products, stock, prices or product attributes.
async function main() {
  const db = await getDb();
  const existing = await db.select().from(categories);
  const records = CATEGORIES_TREE.flatMap((top) => [
    { slug: top.slug, nameRu: top.nameRu, parentSlug: null as string | null },
    ...top.subcategories.flatMap((sub) => [
      { slug: sub.slug, nameRu: sub.nameRu, parentSlug: top.slug },
      ...(sub.children ?? []).map((child) => ({
        slug: child.slug,
        nameRu: child.nameRu,
        parentSlug: sub.slug,
      })),
    ]),
  ]);
  if (new Set(records.map((row) => row.slug)).size !== records.length)
    throw new Error("Duplicate reference slugs");
  console.log(
    JSON.stringify({
      referenceCategories: records.length,
      existingCategories: existing.length,
      create: records.filter((row) => !existing.some((item) => item.slug === row.slug)).length,
      mode: process.argv.includes("--apply") ? "apply" : "preview",
      retainedLegacyCategories: existing.filter(
        (row) => !records.some((item) => item.slug === row.slug),
      ).length,
    }),
  );
  if (!process.argv.includes("--apply")) return;
  await db.transaction(async (tx) => {
    const ids = new Map<string, string>();
    for (const [sort, row] of records.entries()) {
      const parentId = row.parentSlug ? ids.get(row.parentSlug) : null;
      if (row.parentSlug && !parentId) throw new Error("Missing taxonomy parent");
      const found = existing.find((item) => item.slug === row.slug);
      const details = { nameRu: row.nameRu, parentId: parentId ?? null, sort: sort * 10 };
      if (found) {
        await tx.update(categories).set(details).where(eq(categories.id, found.id));
        ids.set(row.slug, found.id);
      } else {
        const [created] = await tx
          .insert(categories)
          .values({ ...details, slug: row.slug, isActive: "true" })
          .returning({ id: categories.id });
        ids.set(row.slug, created.id);
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

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { expect, it } from "vitest";
import { getDb } from "@/db";
import { auditLog, categories, products, users } from "@/db/schema";
import type { SessionUser } from "@/modules/auth/session";
import { createProduct, updateProduct } from "@/modules/catalog/admin-service";
import {
  exportProducts,
  parseProductFile,
  validateImportRows,
} from "@/modules/catalog/import-export";

const nameTg = "Номи санҷишӣ";
const descriptionTg = 'Матни санҷишӣ, "бо нохунак"\nСатри дуюм: ӣ, ӯ, қ, ғ, ҳ, ҷ.';

async function fixture() {
  const db = await getDb();
  const suffix = randomUUID();
  const [category] = await db
    .insert(categories)
    .values({
      slug: `bilingual-${suffix}`,
      nameRu: "Тестовая группа",
      isActive: "true",
    })
    .returning();
  const [actor] = await db.select().from(users).where(eq(users.role, "SUPER_ADMIN")).limit(1);
  const sku = `BILINGUAL-${suffix}`;
  return {
    db,
    category,
    actor: actor as SessionUser,
    sku,
    row: {
      sku,
      slug: `bilingual-${suffix}`,
      nameRu: "Тестовый товар",
      categorySlug: category.slug,
      unit: "шт.",
      status: "DRAFT",
      descriptionRu: "Русское описание",
      markupPercent: "7",
    },
    clean: async () => {
      const rows = await db.select().from(products).where(eq(products.categoryId, category.id));
      for (const row of rows) await db.delete(auditLog).where(eq(auditLog.entityId, row.id));
      await db.delete(products).where(eq(products.categoryId, category.id));
      await db.delete(categories).where(eq(categories.id, category.id));
    },
  };
}

it.each(["csv", "xlsx"])(
  "round-trips both supplied language fields through %s export, validation and persisted import",
  async (format) => {
    // Dropping either translation during export, validation or product writes loses these literal values.
    const f = await fixture();
    try {
      const [source] = await f.db
        .insert(products)
        .values({
          sku: f.sku,
          slug: f.row.slug,
          nameRu: f.row.nameRu,
          categoryId: f.category.id,
          unit: "шт.",
          status: "DRAFT",
          nameTg,
          descriptionTg,
        })
        .returning();
      const exported = await exportProducts(format);
      const rows = await parseProductFile(
        new File([new Uint8Array(exported.data)], `catalog.${format}`),
      );
      const row = rows.find((r) => r.sku === f.sku)!;
      expect(row).toMatchObject({ nameTg, descriptionTg });
      // Re-import as a new SKU to exercise the same create path used by the import route.
      const [validated] = await validateImportRows([
        { ...row, sku: `${f.sku}-COPY`, slug: `${f.row.slug}-copy` },
      ]);
      expect(validated.valid).toBe(true);
      const created = await createProduct(f.actor, validated.data);
      expect(created).toMatchObject({ nameTg, descriptionTg, nameRu: "Тестовый товар" });
      const [saved] = await f.db.select().from(products).where(eq(products.id, created.id));
      expect(saved).toMatchObject({ nameTg, descriptionTg });
      const [update] = await validateImportRows([
        { ...row, nameTg: "Номи нав", descriptionTg: "Матни нав" },
      ]);
      expect(update.id).toBe(source.id);
      await updateProduct(f.actor, update.id!, update.data);
      expect(
        (await f.db.select().from(products).where(eq(products.id, source.id)))[0],
      ).toMatchObject({ nameTg: "Номи нав", descriptionTg: "Матни нав" });
    } finally {
      await f.clean();
    }
  },
);

it("accepts legacy headers and preserves stored translations when optional columns are missing or blank", async () => {
  // Treating optional empty cells as null would erase existing translations on a routine catalog update.
  const f = await fixture();
  try {
    const legacyHeaders =
      "sku,slug,nameRu,categorySlug,brand,unit,status,descriptionRu,markupPercent";
    const legacyValues = `${f.sku},${f.row.slug},Тестовый товар,${f.category.slug},,шт.,DRAFT,Русское описание,7`;
    const [legacyRow] = await parseProductFile(
      new File([`${legacyHeaders}\n${legacyValues}`], "legacy.csv"),
    );
    const [validated] = await validateImportRows([legacyRow]);
    expect(validated.valid).toBe(true);
    const created = await createProduct(f.actor, validated.data);
    expect(created).toMatchObject({ nameTg: null, descriptionTg: null });
    await f.db.update(products).set({ nameTg, descriptionTg }).where(eq(products.id, created.id));
    for (const cells of [
      {},
      { nameTg: "", descriptionTg: "" },
      { nameTg: "  ", descriptionTg: " \n " },
    ] as Record<string, string>[]) {
      const [update] = await validateImportRows([
        { ...legacyRow, ...cells, nameRu: "Обновлённый товар" },
      ]);
      expect(update.valid).toBe(true);
      await updateProduct(f.actor, update.id!, update.data);
      expect(
        (await f.db.select().from(products).where(eq(products.id, created.id)))[0],
      ).toMatchObject({ nameRu: "Обновлённый товар", nameTg, descriptionTg });
    }
  } finally {
    await f.clean();
  }
});

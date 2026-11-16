import { sql } from "drizzle-orm";
import { suppliers, supplierUsers, products } from "../src/db/schema";
import type { AppDatabase } from "../src/db";
import { importJctopCatalog } from "./import-jctop-catalog";

export async function seedCatalog(db: AppDatabase, supplierUserIds: string[]) {
  const [supplierCount] = await db.select({ count: sql<number>`count(*)::int` }).from(suppliers);
  let supplierRows = await db.select().from(suppliers).orderBy(suppliers.name);
  if (!supplierCount.count) {
    supplierRows = await db
      .insert(suppliers)
      .values([
        {
          name: "Сомон Снаб",
          legalName: "ООО «Сомон Снаб»",
          phone: "+992900100001",
          email: "sales@somon.example",
          status: "ACTIVE",
        },
        {
          name: "Вахш Трейд",
          legalName: "ООО «Вахш Трейд»",
          phone: "+992900100002",
          email: "sales@vakhsh.example",
          status: "ACTIVE",
        },
        {
          name: "Памир Строй",
          legalName: "ООО «Памир Строй»",
          phone: "+992900100003",
          email: "sales@pamir.example",
          status: "ACTIVE",
        },
      ])
      .returning();
    await db
      .insert(supplierUsers)
      .values(
        supplierRows.map((supplier, index) => ({
          supplierId: supplier.id,
          userId: supplierUserIds[index],
          role: index === 0 ? "OWNER" : "STAFF",
        })),
      );
  }
  const [productCount] = await db.select({ count: sql<number>`count(*)::int` }).from(products);
  if (productCount.count > 0) return;

  await importJctopCatalog(db);
}

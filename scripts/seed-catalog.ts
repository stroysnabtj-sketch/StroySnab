import { sql } from "drizzle-orm";
import {
  categories,
  products,
  productAttributes,
  supplierOffers,
  suppliers,
  supplierUsers,
} from "../src/db/schema";
import type { AppDatabase } from "../src/db";

const groups = [
  {
    root: ["cement", "Цемент и сухие смеси"],
    children: [
      ["cement-bags", "Цемент", "Цемент М500 Д0", "мешок"],
      ["dry-mixes", "Сухие смеси", "Смесь строительная универсальная", "мешок"],
    ],
  },
  {
    root: ["metal", "Металлопрокат"],
    children: [
      ["rebar", "Арматура", "Арматура рифлёная А500С", "тонна"],
      ["metal-profile", "Профиль и трубы", "Труба профильная стальная", "тонна"],
    ],
  },
  {
    root: ["masonry", "Кирпич и блоки"],
    children: [
      ["brick", "Кирпич", "Кирпич керамический рядовой", "шт."],
      ["blocks", "Блоки", "Блок стеновой", "шт."],
    ],
  },
  {
    root: ["roofing", "Кровля и изоляция"],
    children: [
      ["roof-sheets", "Кровельные материалы", "Профнастил кровельный оцинкованный", "м²"],
      ["insulation", "Теплоизоляция", "Утеплитель минеральный", "упаковка"],
    ],
  },
  {
    root: ["plumbing", "Сантехника"],
    children: [
      ["pipes", "Трубы", "Труба полипропиленовая PN20", "м"],
      ["fittings", "Фитинги", "Фитинг полипропиленовый", "шт."],
    ],
  },
  {
    root: ["electric", "Электрика"],
    children: [
      ["cables", "Кабель и провод", "Кабель ВВГнг-LS", "м"],
      ["electrical-panels", "Электроустановка", "Щит электрический навесной", "шт."],
    ],
  },
  {
    root: ["finishing", "Отделочные материалы"],
    children: [
      ["paint", "Лакокрасочные материалы", "Краска интерьерная моющаяся", "ведро"],
      ["plaster", "Штукатурка и шпатлёвка", "Шпатлёвка финишная", "мешок"],
    ],
  },
  {
    root: ["tools", "Инструмент и крепёж"],
    children: [
      ["power-tools", "Электроинструмент", "Перфоратор профессиональный", "шт."],
      ["fasteners", "Крепёж", "Саморез строительный", "упаковка"],
    ],
  },
] as const;
const brands = ["Сомон Строй", "Душанбе Материал", "Вахш", "Памир"];
const variants = [
  "стандарт",
  "усиленный",
  "профессиональный",
  "эконом",
  "для наружных работ",
  "для внутренних работ",
  "влагостойкий",
  "морозостойкий",
  "высокопрочный",
  "универсальный",
  "серия 10",
  "серия 20",
  "серия 30",
  "серия 40",
  "серия 50",
];

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
  const categoryRows: { id: string; slug: string; parentId: string | null }[] = [];
  let sort = 0;
  for (const group of groups) {
    const [root] = await db
      .insert(categories)
      .values({ slug: group.root[0], nameRu: group.root[1], sort: sort++ })
      .returning();
    categoryRows.push(root);
    for (const [slug, name] of group.children) {
      const [child] = await db
        .insert(categories)
        .values({ slug, nameRu: name, parentId: root.id, sort: sort++ })
        .returning();
      categoryRows.push(child);
    }
  }
  const productValues: (typeof products.$inferInsert)[] = [];
  const attributeValues: { key: string; attrs: [string, string][] }[] = [];
  let index = 0;
  for (const group of groups)
    for (const [slug, , base, unit] of group.children) {
      const category = categoryRows.find((row) => row.slug === slug)!;
      for (let variant = 0; variant < 15; variant++) {
        index++;
        const key = `${slug}-${String(variant + 1).padStart(2, "0")}`;
        const brand = brands[(variant + index) % brands.length];
        const name = `${base} ${variants[variant]} ${brand}`;
        productValues.push({
          sku: `KH-${String(index).padStart(5, "0")}`,
          slug: key,
          nameRu: name,
          descriptionRu: `${name}. Сертифицированный строительный материал для объектов в Душанбе и регионах Таджикистана. Поставка от проверенных поставщиков с подтверждением остатка.`,
          categoryId: category.id,
          brand,
          unit,
          status: "PUBLISHED",
        });
        attributeValues.push({
          key,
          attrs: [
            ["Бренд", brand],
            ["Единица", unit],
            ["Назначение", "Строительство и ремонт"],
            ["Страна поставки", "Таджикистан"],
          ],
        });
      }
    }
  const inserted = await db.insert(products).values(productValues).returning();
  await db
    .insert(productAttributes)
    .values(
      inserted.flatMap((product) =>
        attributeValues
          .find((entry) => entry.key === product.slug)!
          .attrs.map(([name, value]) => ({ productId: product.id, name, value })),
      ),
    );
  const offerValues: (typeof supplierOffers.$inferInsert)[] = [];
  inserted.forEach((product, productIndex) => {
    const offersCount = productIndex % 5 === 0 ? 3 : productIndex % 2 === 0 ? 2 : 1;
    for (let offerIndex = 0; offerIndex < offersCount; offerIndex++) {
      const supplier = supplierRows[(productIndex + offerIndex) % supplierRows.length];
      const price = BigInt(2500 + ((productIndex * 7919 + offerIndex * 1237) % 450000));
      const stock =
        productIndex % 17 === 0 && offerIndex === 0
          ? "0"
          : String(10 + ((productIndex * 13 + offerIndex * 7) % 900));
      offerValues.push({
        productId: product.id,
        supplierId: supplier.id,
        supplierPriceDirams: price,
        stockQty: stock,
        minOrderQty: product.unit === "тонна" ? "0.5" : "1",
        leadTimeDays: (productIndex + offerIndex) % 4,
        isActive: "true",
      });
    }
  });
  for (let offset = 0; offset < offerValues.length; offset += 100)
    await db.insert(supplierOffers).values(offerValues.slice(offset, offset + 100));
  console.log(
    `Seeded ${categoryRows.length} categories, ${inserted.length} products and ${offerValues.length} offers`,
  );
}

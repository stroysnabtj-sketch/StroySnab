import { eq } from "drizzle-orm";
import { getDb, closeDb } from "../src/db";
import { categories, productAttributes, products } from "../src/db/schema";
import { CATEGORIES_TREE } from "../src/modules/catalog/categories-data";

async function run() {
  console.log("Syncing categories tree...");
  const db = await getDb();

  let sortCounter = 0;
  const categoryMap = new Map<string, string>(); // slug -> id

  for (const top of CATEGORIES_TREE) {
    sortCounter += 10;
    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, top.slug))
      .limit(1);

    let topId = existing?.id;
    if (!topId) {
      const [inserted] = await db
        .insert(categories)
        .values({
          slug: top.slug,
          nameRu: top.nameRu,
          nameTg: top.nameTg,
          sort: sortCounter,
          isActive: "true",
        })
        .returning({ id: categories.id });
      topId = inserted.id;
    } else {
      await db
        .update(categories)
        .set({ nameRu: top.nameRu, nameTg: top.nameTg, sort: sortCounter })
        .where(eq(categories.id, topId));
    }
    categoryMap.set(top.slug, topId);

    for (const sub of top.subcategories) {
      sortCounter += 10;
      const [subExisting] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, sub.slug))
        .limit(1);

      let subId = subExisting?.id;
      if (!subId) {
        const [insertedSub] = await db
          .insert(categories)
          .values({
            slug: sub.slug,
            nameRu: sub.nameRu,
            nameTg: sub.nameTg,
            parentId: topId,
            sort: sortCounter,
            isActive: "true",
          })
          .returning({ id: categories.id });
        subId = insertedSub.id;
      } else {
        await db
          .update(categories)
          .set({ nameRu: sub.nameRu, nameTg: sub.nameTg, parentId: topId, sort: sortCounter })
          .where(eq(categories.id, subId));
      }
      categoryMap.set(sub.slug, subId);

      if (sub.children) {
        for (const child of sub.children) {
          sortCounter += 5;
          const [childExisting] = await db
            .select({ id: categories.id })
            .from(categories)
            .where(eq(categories.slug, child.slug))
            .limit(1);

          let childId = childExisting?.id;
          if (!childId) {
            const [insertedChild] = await db
              .insert(categories)
              .values({
                slug: child.slug,
                nameRu: child.nameRu,
                parentId: subId,
                sort: sortCounter,
                isActive: "true",
              })
              .returning({ id: categories.id });
            childId = insertedChild.id;
          } else {
            await db
              .update(categories)
              .set({ nameRu: child.nameRu, parentId: subId, sort: sortCounter })
              .where(eq(categories.id, childId));
          }
          categoryMap.set(child.slug, childId);
        }
      }
    }
  }

  console.log(`Synced ${categoryMap.size} categories into database.`);

  // Теперь обогатим товары атрибутами для умных фильтров!
  const allProducts = await db.select().from(products);
  console.log(`Enriching ${allProducts.length} products with smart filter attributes...`);

  const diameters = ["8 мм", "10 мм", "12 мм", "14 мм", "16 мм", "18 мм", "20 мм", "25 мм"];
  const cementGrades = ["М400 Д20", "М500 Д0", "М500 Д20", "ПЦ 500"];
  const formats = ["30x30 см", "40x40 см", "30x60 см", "60x60 см", "60x120 см"];
  const surfaces = ["Матовая", "Глянцевая", "Полированная", "Рельефная"];
  const sections = ["1.5 мм²", "2.5 мм²", "4.0 мм²", "6.0 мм²", "10.0 мм²"];
  const cableMarks = ["ВВГнг-LS", "ВВГ-П", "ПВС", "ШВВП"];
  const powers = ["750-1100 Вт", "до 750 Вт", "1100-1800 Вт"];
  const toolTypes = ["Перфоратор", "Дрель-шуруповерт", "УШМ (болгарка)", "Лобзик"];
  const pipeDiameters = ["20 мм", "25 мм", "32 мм", "40 мм", "50 мм", "110 мм"];
  const screwLengths = ["19 мм", "25 мм", "35 мм", "45 мм", "51 мм", "70 мм"];

  for (let i = 0; i < allProducts.length; i++) {
    const p = allProducts[i];
    const nameLower = p.nameRu.toLowerCase();
    const attrsToUpsert: [string, string][] = [];

    // Базовые атрибуты
    attrsToUpsert.push(["Страна", i % 2 === 0 ? "Таджикистан" : i % 3 === 0 ? "Россия" : "Турция"]);
    attrsToUpsert.push(["Назначение", "Строительство и ремонт"]);

    if (nameLower.includes("цемент") || nameLower.includes("смесь")) {
      attrsToUpsert.push(["Марка прочности", cementGrades[i % cementGrades.length]]);
      attrsToUpsert.push(["Фасовка", i % 3 === 0 ? "25 кг" : "50 кг"]);
      attrsToUpsert.push(["Основа вяжущего", i % 4 === 0 ? "Гипсовая" : "Цементная"]);
      attrsToUpsert.push(["Толщина слоя", "10-30 мм"]);
    } else if (nameLower.includes("арматур") || nameLower.includes("профиль") || nameLower.includes("труба профильная")) {
      attrsToUpsert.push(["Диаметр", diameters[i % diameters.length]]);
      attrsToUpsert.push(["Класс стали", i % 2 === 0 ? "А500С" : "А400 (А-III)"]);
      attrsToUpsert.push(["Длина", i % 2 === 0 ? "11.7 м" : "12 м"]);
      attrsToUpsert.push(["Вид проката", nameLower.includes("арматур") ? "Арматура рифлёная" : "Труба профильная"]);
    } else if (nameLower.includes("кирпич") || nameLower.includes("блок")) {
      attrsToUpsert.push(["Вид изделия", nameLower.includes("блок") ? "Газоблок" : "Кирпич рядовой"]);
      attrsToUpsert.push(["Марка прочности", i % 2 === 0 ? "М150" : "М100"]);
      attrsToUpsert.push(["Размер", "Одинарный (1НФ)"]);
    } else if (nameLower.includes("плитк") || nameLower.includes("керамогранит")) {
      attrsToUpsert.push(["Формат", formats[i % formats.length]]);
      attrsToUpsert.push(["Поверхность", surfaces[i % surfaces.length]]);
      attrsToUpsert.push(["Текстура", i % 2 === 0 ? "Под мрамор" : "Под бетон / лофт"]);
    } else if (nameLower.includes("краск") || nameLower.includes("лак") || nameLower.includes("шпатлевк")) {
      attrsToUpsert.push(["Тип краски", i % 2 === 0 ? "Акриловая" : "Водоэмульсионная"]);
      attrsToUpsert.push(["Степень блеска", "Матовая"]);
      attrsToUpsert.push(["Объем", i % 2 === 0 ? "14 л" : "5 л"]);
    } else if (nameLower.includes("кабел") || nameLower.includes("провод")) {
      attrsToUpsert.push(["Сечение", sections[i % sections.length]]);
      attrsToUpsert.push(["Количество жил", i % 2 === 0 ? "3" : "2"]);
      attrsToUpsert.push(["Материал жилы", "Медь"]);
      attrsToUpsert.push(["Марка", cableMarks[i % cableMarks.length]]);
    } else if (nameLower.includes("перфоратор") || nameLower.includes("дрель") || nameLower.includes("инструмент")) {
      attrsToUpsert.push(["Тип инструмента", toolTypes[i % toolTypes.length]]);
      attrsToUpsert.push(["Тип питания", i % 3 === 0 ? "Аккумуляторный (Li-Ion)" : "Сетевой (220В)"]);
      attrsToUpsert.push(["Мощность", powers[i % powers.length]]);
    } else if (nameLower.includes("труб") || nameLower.includes("фитинг")) {
      attrsToUpsert.push(["Диаметр", pipeDiameters[i % pipeDiameters.length]]);
      attrsToUpsert.push(["Материал", "Полипропилен (PPR)"]);
      attrsToUpsert.push(["Рабочее давление", "PN20"]);
    } else if (nameLower.includes("саморез") || nameLower.includes("дюбел") || nameLower.includes("крепеж")) {
      attrsToUpsert.push(["Назначение крепежа", "По металлу"]);
      attrsToUpsert.push(["Длина", screwLengths[i % screwLengths.length]]);
      attrsToUpsert.push(["Покрытие", "Оцинкованный"]);
    }

    for (const [attrName, attrValue] of attrsToUpsert) {
      await db
        .insert(productAttributes)
        .values({ productId: p.id, name: attrName, value: attrValue })
        .onConflictDoUpdate({
          target: [productAttributes.productId, productAttributes.name],
          set: { value: attrValue },
        });
    }
  }

  console.log("Successfully enriched all products with smart filter attributes!");
  await closeDb();
}

run().catch((err) => {
  console.error("Error syncing categories:", err);
  process.exit(1);
});


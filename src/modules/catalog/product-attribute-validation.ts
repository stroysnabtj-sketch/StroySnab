import { attributeNumber } from "./attribute-values";
import { and, eq } from "drizzle-orm";
import type { DbExecutor } from "@/db";
import { categories } from "@/db/schema";
import { ApiError } from "@/server/api-error";
import { getRelevantProductAttributes, getSmartFiltersForCategory } from "./categories-data";
type Attribute = { name: string; value: string };
export function normalizeProductAttributes(slug: string, attributes: Attribute[]): Attribute[] {
  const definitions = getSmartFiltersForCategory(slug);
  const values: Record<string, string> = {};
  for (const attribute of attributes) {
    const field = definitions.find((f) => f.key === attribute.name || f.label === attribute.name);
    const key = field?.key ?? attribute.name.trim();
    let value = attribute.value.trim();
    const fail = () => {
      throw new ApiError(
        400,
        "invalid_attribute",
        `Проверьте характеристику «${field?.label ?? key}»`,
        {
          [key]:
            field?.type === "range"
              ? `Укажите число${field.unit ? ` в ${field.unit}` : ""}`
              : "Некорректное значение",
        },
      );
    };
    if (key in values) fail();
    if (field?.type === "boolean") {
      const boolean = value.toLocaleLowerCase("ru");
      if (["да", "true", "1"].includes(boolean)) value = "Да";
      else if (["нет", "false", "0"].includes(boolean)) value = "Нет";
      else fail();
    } else if (field?.type === "range") {
      const number = attributeNumber(value, field.unit);
      if (number === undefined) fail();
      value = String(number);
    }
    values[key] = value;
  }
  const relevant = getRelevantProductAttributes(slug, values);
  for (const key of Object.keys(values))
    if (!(key in relevant))
      throw new ApiError(
        400,
        "irrelevant_attribute",
        "Характеристики не соответствуют выбранному виду товара",
        { [key]: "Удалите характеристику другого вида товара" },
      );
  return Object.entries(values).map(([name, value]) => ({ name, value }));
}
export async function validateProductCategory(
  db: DbExecutor,
  id: string,
  attributes?: Attribute[],
) {
  const [category] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.isActive, "true")))
    .limit(1);
  if (!category)
    throw new ApiError(400, "invalid_category", "Выберите действующую категорию", {
      categoryId: "Категория не найдена или скрыта",
    });
  const [child] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.parentId, id), eq(categories.isActive, "true")))
    .limit(1);
  if (child)
    throw new ApiError(400, "invalid_category", "Выберите конечную товарную группу", {
      categoryId: "Уточните товарную группу внутри раздела",
    });
  return attributes ? normalizeProductAttributes(category.slug, attributes) : undefined;
}

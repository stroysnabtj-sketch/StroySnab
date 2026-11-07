import { describe, expect, it } from "vitest";
import {
  CATEGORIES_TREE,
  getCategoryProfile,
  getSmartFiltersForCategory,
  getProductAttributeFields,
  getRelevantProductAttributes,
} from "@/modules/catalog/categories-data";

describe("reference category profiles", () => {
  const leaves = CATEGORIES_TREE.flatMap((top) =>
    top.subcategories.flatMap((sub) => (sub.children?.length ? sub.children : [sub])),
  );
  it("binds every reference leaf to its own profile", () => {
    expect(leaves).toHaveLength(319);
    expect(
      leaves.filter((leaf) => !getCategoryProfile(leaf.slug)).map((leaf) => leaf.nameRu),
    ).toEqual([]);
    for (const leaf of leaves) {
      const profile = getCategoryProfile(leaf.slug)!;
      expect(getSmartFiltersForCategory(leaf.slug).map((field) => field.label)).toEqual([
        ...profile.primary,
        ...profile.additional,
      ]);
    }
  });
  it("does not assign the first child's characteristics to a parent", () => {
    expect(getSmartFiltersForCategory("building-materials").map((field) => field.key)).toEqual([
      "brand",
      "inStock",
      "price",
    ]);
  });
  it("shows dependent tool fields only for the matching kind", () => {
    const slug = "dreli-i-shurupoverty";
    const fields = getSmartFiltersForCategory(slug);
    const controller = fields.find((field) => field.label === "Вид инструмента")!;
    expect(controller).toBeDefined();
    const battery = fields.find((field) => field.label === "Напряжение аккумулятора")!;
    expect(
      getRelevantProductAttributes(slug, {
        [controller.key]: "Дрель",
        [battery.key]: "18",
        "Особое свойство": "сохранить",
      }),
    ).toEqual({ [controller.key]: "Дрель", "Особое свойство": "сохранить" });
    expect(
      getProductAttributeFields(slug, { [controller.key]: "Дрель" }).some(
        (field) => field.label === "Напряжение аккумулятора",
      ),
    ).toBe(false);
    expect(
      getProductAttributeFields(slug, { [controller.key]: "Шуруповёрт" }).some(
        (field) => field.label === "Напряжение аккумулятора",
      ),
    ).toBe(true);
  });
});

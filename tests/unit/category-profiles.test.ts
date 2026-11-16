import { describe, expect, it } from "vitest";
import {
  CATEGORIES_TREE,
  getCategoryProfile,
  getSmartFiltersForCategory,
  getProductAttributeFields,
  getRelevantProductAttributes,
} from "@/modules/catalog/categories-data";

describe("reference category profiles", () => {
  it("binds every reference category to its own profile and filters", () => {
    expect(CATEGORIES_TREE).toHaveLength(18);
    for (const cat of CATEGORIES_TREE) {
      const profile = getCategoryProfile(cat.slug);
      expect(profile).toBeDefined();
      const filters = getSmartFiltersForCategory(cat.slug);
      expect(filters.length).toBeGreaterThan(0);
      expect(filters.map((f) => f.label)).toEqual([
        ...profile!.primary,
        ...profile!.additional,
      ]);
    }
  });

  it("provides specific smart filters for cordless power tools", () => {
    const slug = "akkumulyatornyy-instrument";
    const fields = getSmartFiltersForCategory(slug);
    const typeField = fields.find((field) => field.label === "Тип инструмента");
    expect(typeField).toBeDefined();
    const voltageField = fields.find((field) => field.label === "Напряжение аккумулятора");
    expect(voltageField).toBeDefined();

    const attrs = {
      [typeField!.key]: "Аккумуляторная ударная дрель",
      [voltageField!.key]: "21 В",
    };
    expect(getRelevantProductAttributes(slug, attrs)).toEqual(attrs);
    expect(getProductAttributeFields(slug, attrs).length).toBeGreaterThan(0);
  });
});

import { expect, it } from "vitest";
import { legacyCategoryTarget } from "@/modules/catalog/legacy-taxonomy";
import { getCategoryProfile } from "@/modules/catalog/categories-data";
it("maps an identified product to a reference leaf", () => {
  const target = legacyCategoryTarget("cement-bags", "Цемент М500 Д0");
  expect(target).toBe("tsement-beton");
  expect(getCategoryProfile(target)).toBeDefined();
});
it("does not guess ambiguous mixtures, insulation or unrelated products", () => {
  expect(legacyCategoryTarget("dry-mixes", "Смесь строительная универсальная")).toBeUndefined();
  expect(legacyCategoryTarget("insulation", "Утеплитель неизвестного состава")).toBeUndefined();
  expect(legacyCategoryTarget("cement-bags", "Монтажная пена")).toBeUndefined();
});

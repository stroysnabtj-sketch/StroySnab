import { expect, it } from "vitest";
import { legacyCategoryTarget, LEGACY_CATEGORY_REDIRECTS } from "@/modules/catalog/legacy-taxonomy";
import { getCategoryProfile } from "@/modules/catalog/categories-data";

it("maps old category slugs to existing JCTOP categories", () => {
  for (const target of Object.values(LEGACY_CATEGORY_REDIRECTS))
    expect(getCategoryProfile(target)).toBeDefined();
  expect(legacyCategoryTarget("power-tools", "Перфоратор")).toBe("setevoy-elektroinstrument");
});

it("returns undefined for unknown categories", () => {
  expect(legacyCategoryTarget("unknown-slug", "Что-то")).toBeUndefined();
});

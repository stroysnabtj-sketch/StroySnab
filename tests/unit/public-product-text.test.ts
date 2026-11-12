import { describe, expect, it } from "vitest";
import { publicProductBrand, publicProductText } from "@/modules/catalog/public-text";
describe("storefront product labels", () => {
  it("removes legacy supplier labels from names and descriptions", () => {
    expect(publicProductText("Арматура A500C влагостойкий Памир")).toBe(
      "Арматура A500C влагостойкий",
    );
    expect(publicProductText("Цемент М500 Душанбе Материал")).toBe("Цемент М500");
    expect(publicProductText("Кабель Вахш Трейд")).toBe("Кабель");
  });
  it("hides demo procurement brands but keeps real manufacturer brands", () => {
    expect(publicProductBrand("Памир")).toBeNull();
    expect(publicProductBrand("Душанбе Материал")).toBeNull();
    expect(publicProductBrand("Knauf")).toBe("Knauf");
  });
  it("does not remove a name fragment inside another word", () => {
    expect(publicProductText("Памирский камень")).toBe("Памирский камень");
  });
});

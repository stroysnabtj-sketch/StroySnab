import { expect, it } from "vitest";
import { normalizeProductAttributes } from "@/modules/catalog/product-attribute-validation";

it("normalizes attribute names by smart-filter label", () => {
  const values = normalizeProductAttributes("akkumulyatornyy-instrument", [
    { name: "Тип инструмента", value: " Аккумуляторная ударная дрель " },
  ]);
  expect(values[0]).toEqual({ name: "Тип", value: "Аккумуляторная ударная дрель" });
});

it("rejects duplicate aliases of the same attribute", () => {
  expect(() =>
    normalizeProductAttributes("akkumulyatornyy-instrument", [
      { name: "Тип инструмента", value: "Дрель" },
      { name: "Тип", value: "Гайковёрт" },
    ]),
  ).toThrow();
});

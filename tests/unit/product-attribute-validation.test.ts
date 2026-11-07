import { expect, it } from "vitest";
import { normalizeProductAttributes } from "@/modules/catalog/product-attribute-validation";
it("normalizes names, decimal commas and compatible measurement units", () => {
  const values = normalizeProductAttributes("gipsokarton", [
    { name: "Толщина листа", value: "1,2 см" },
  ]);
  expect(values[0].value).toBe("12");
  expect(values[0].name).not.toBe("Толщина листа");
});
it("rejects invalid numeric values, incompatible units and duplicate aliases", () => {
  expect(() =>
    normalizeProductAttributes("gipsokarton", [{ name: "Толщина листа", value: "тонкий" }]),
  ).toThrow();
  expect(() =>
    normalizeProductAttributes("gipsokarton", [{ name: "Толщина листа", value: "12 кг" }]),
  ).toThrow();
  expect(() =>
    normalizeProductAttributes("gipsokarton", [
      { name: "Толщина листа", value: "12" },
      { name: "tolshchina-lista", value: "13" },
    ]),
  ).toThrow();
});

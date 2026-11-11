import { expect, it } from "vitest";
import * as catalog from "@/modules/catalog/types";

it("keeps catalog ranges isolated from the prototype shared by other requests", () => {
  const previousMin = Object.getOwnPropertyDescriptor(Object.prototype, "min");
  try {
    const ranges = catalog.parseCatalogAttributeRanges({
      "rangeMin.__proto__": "117",
      "rangeMin.weight": ["12,5", "99"],
      "rangeMax.weight": "18",
      "rangeMax.invalid": "NaN",
    });
    expect(Object.getOwnPropertyDescriptor(Object.prototype, "min")).toEqual(previousMin);
    expect(Object.hasOwn(ranges, "__proto__")).toBe(false);
    expect(ranges.weight).toEqual({ min: 12.5, max: 18 });
    expect(Object.hasOwn(ranges, "invalid")).toBe(false);
  } finally {
    if (previousMin) Object.defineProperty(Object.prototype, "min", previousMin);
    else Reflect.deleteProperty(Object.prototype, "min");
  }
});

it("accepts the three catalog sizes and defaults malformed or unsupported values to 20", () => {
  for (const size of [20, 50, 100]) expect(catalog.catalogPageSize(String(size))).toBe(size);
  for (const value of [undefined, "24", "NaN", "-1", "50.5", ""])
    expect(catalog.catalogPageSize(value)).toBe(20);
});

it("changes page size without losing repeated filters and resets the current page", () => {
  const url = catalog.catalogPageSizeUrl(
    new URLSearchParams(
      "q=цемент&category=cement&brand=A&brand=B&rangeMin.weight=5&sort=price_asc&page=7",
    ),
    100,
  );
  const params = new URL(url, "http://localhost").searchParams;
  expect(params.getAll("brand")).toEqual(["A", "B"]);
  expect(params.get("q")).toBe("цемент");
  expect(params.get("category")).toBe("cement");
  expect(params.get("rangeMin.weight")).toBe("5");
  expect(params.get("sort")).toBe("price_asc");
  expect(params.get("pageSize")).toBe("100");
  expect(params.has("page")).toBe(false);
});

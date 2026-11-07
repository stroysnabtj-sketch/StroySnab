import { expect, it } from "vitest";
import * as catalog from "@/modules/catalog/types";

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

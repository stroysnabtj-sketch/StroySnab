export const CATALOG_PAGE_SIZES = [20, 50, 100] as const;

export function catalogPageSize(value?: string): number {
  const size = Number(value);
  return CATALOG_PAGE_SIZES.some((allowed) => allowed === size) ? size : 20;
}

export function catalogPageSizeUrl(params: URLSearchParams, size: number): string {
  const next = new URLSearchParams(params);
  next.set("pageSize", String(catalogPageSize(String(size))));
  next.delete("page");
  return `/catalog?${next}`;
}

export type PublicProduct = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  description: string | null;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  brand: string | null;
  unit: string;
  priceDirams: string;
  minOrderQty: string;
  oldPriceDirams?: string | null;
  stockQty: string;
  offerId: string;
  offerCount: number;
  leadTimeDays: number;
  isHit?: boolean;
  isNew?: boolean;
  keyAttributes?: { name: string; value: string }[];
  imageKey?: string | null;
  imageUrl?: string | null;
};

export type CatalogQuery = {
  diverse?: boolean;
  q?: string;
  category?: string;
  brand?: string;
  brands?: string[];
  minPrice?: string;
  maxPrice?: string;
  inStock?: boolean;
  attributeName?: string;
  attributeValue?: string;
  attributes?: Record<string, string | string[]>;
  attributeRanges?: Record<string, { min?: number; max?: number }>;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export function parseCatalogAttributeRanges(
  params: Record<string, string | string[] | undefined>,
): NonNullable<CatalogQuery["attributeRanges"]> {
  const ranges: NonNullable<CatalogQuery["attributeRanges"]> = Object.create(null);
  for (const [key, value] of Object.entries(params)) {
    const match = key.match(/^range(Min|Max)\.(.+)$/);
    if (!match || Object.hasOwn(Object.prototype, match[2])) continue;
    const raw = Array.isArray(value) ? value[0] : value;
    if (!raw?.trim()) continue;
    const number = Number(raw.replace(",", "."));
    if (!Number.isFinite(number)) continue;
    ranges[match[2]] ??= {};
    ranges[match[2]][match[1] === "Min" ? "min" : "max"] = number;
  }
  return ranges;
}

export interface FilterFacetOption {
  value: string;
  count: number;
  selected?: boolean;
}

export interface SmartFilterFacetGroup {
  key: string;
  label: string;
  type: "checkbox" | "range" | "select" | "boolean";
  options: FilterFacetOption[];
  min?: number;
  max?: number;
  unit?: string;
  isExtra?: boolean;
}

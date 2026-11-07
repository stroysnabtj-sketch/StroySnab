import { attributeNumber } from "./attribute-values";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  categories,
  productAttributes,
  productImages,
  products,
  supplierOffers,
  suppliers,
} from "@/db/schema";
import type { CatalogQuery, PublicProduct, SmartFilterFacetGroup } from "./types";
import { getSmartFiltersForCategory } from "./categories-data";

import { visibleCategoryIds } from "./category-visibility";

function displayAttribute(slug: string, attribute: { name: string; value: string }) {
  const field = getSmartFiltersForCategory(slug).find(
    (item) => item.key === attribute.name || item.label === attribute.name,
  );
  const number = field?.type === "range" ? attributeNumber(attribute.value, field.unit) : undefined;
  const boolean =
    field?.type === "boolean"
      ? ({ true: "Да", false: "Нет", "1": "Да", "0": "Нет" } as Record<string, string>)[
          attribute.value
        ]
      : undefined;
  return {
    name: field?.label ?? attribute.name,
    value:
      number !== undefined
        ? `${number}${field?.unit ? ` ${field.unit}` : ""}`
        : (boolean ?? attribute.value),
  };
}

function retailOffers<T extends { supplierPriceDirams: bigint }>(offers: T[]) {
  return offers
    .filter((o) => o.supplierPriceDirams > 0n)
    .map((o) => ({ ...o, customerPriceDirams: (o.supplierPriceDirams * 107n) / 100n }));
}

export async function listCatalog(query: CatalogQuery) {
  const db = await getDb();
  const conditions = [
    eq(products.status, "PUBLISHED"),
    sql`${categories.id} in (${visibleCategoryIds})`,
  ];
  let categoryIsParent = !query.category;
  if (query.category) {
    const tree = await db
      .select()
      .from(categories)
      .where(sql`${categories.id} in (${visibleCategoryIds})`);
    const root = tree.find((c) => c.slug === query.category);
    categoryIsParent = !!root && tree.some((c) => c.parentId === root.id);
    const ids = new Set(root ? [root.id] : []);
    let changed = true;
    while (changed) {
      changed = false;
      for (const c of tree)
        if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
          ids.add(c.id);
          changed = true;
        }
    }
    conditions.push(ids.size ? inArray(products.categoryId, [...ids]) : sql`false`);
  }
  const search = query.q?.trim();
  if (search)
    conditions.push(
      sql`(to_tsvector('russian', coalesce(${products.nameRu}, '') || ' ' || coalesce(${products.descriptionRu}, '') || ' ' || coalesce(${products.brand}, '')) @@ plainto_tsquery('russian', ${search}) OR similarity(${products.nameRu}, ${search}) > 0.12 OR ${products.nameRu} ILIKE ${`%${search}%`} OR ${products.sku} ILIKE ${`%${search}%`})`,
    );
  const rows = await db
    .select({ product: products, category: categories })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(asc(products.nameRu), asc(products.id));
  const ids = rows.map((r) => r.product.id);
  const [offerRows, rawAttributes, images] = ids.length
    ? await Promise.all([
        db
          .select({ offer: supplierOffers })
          .from(supplierOffers)
          .innerJoin(suppliers, eq(supplierOffers.supplierId, suppliers.id))
          .where(
            and(
              inArray(supplierOffers.productId, ids),
              eq(supplierOffers.isActive, "true"),
              eq(suppliers.status, "ACTIVE"),
            ),
          ),
        db.select().from(productAttributes).where(inArray(productAttributes.productId, ids)),
        db
          .select()
          .from(productImages)
          .where(inArray(productImages.productId, ids))
          .orderBy(asc(productImages.sort), asc(productImages.id)),
      ])
    : [[], [], []];
  const fieldDefinitions = getSmartFiltersForCategory(query.category).filter(
    (field) => !["brand", "price", "inStock"].includes(field.key),
  );
  const canonicalKey = (key: string) =>
    fieldDefinitions.find((field) => field.key === key || field.label === key)?.key ?? key;
  const attrs = rawAttributes.map((attribute) => {
    const field = fieldDefinitions.find(
      (field) => field.key === attribute.name || field.label === attribute.name,
    );
    const numeric =
      field?.type === "range" ? attributeNumber(attribute.value, field.unit) : undefined;
    return {
      ...attribute,
      name: field?.key ?? attribute.name,
      value: numeric === undefined ? attribute.value : String(numeric),
    };
  });
  const ranges = Object.fromEntries(
    Object.entries(query.attributeRanges ?? {}).map(([key, bounds]) => [canonicalKey(key), bounds]),
  );
  const priced = retailOffers(offerRows.map((r) => r.offer));
  const candidates: PublicProduct[] = rows.flatMap(({ product, category }) => {
    const offers = priced
      .filter((o) => o.productId === product.id)
      .sort((a, b) =>
        a.customerPriceDirams < b.customerPriceDirams
          ? -1
          : a.customerPriceDirams > b.customerPriceDirams
            ? 1
            : 0,
      );
    const best =
      offers.find((o) => Number(o.stockQty) - Number(o.reservedQty) >= Number(o.minOrderQty)) ??
      offers[0];
    if (!best) return [];
    const image = images.find((i) => i.productId === product.id);
    return [
      {
        id: product.id,
        sku: product.sku,
        slug: product.slug,
        name: product.nameRu,
        description: product.descriptionRu,
        categoryId: category.id,
        categorySlug: category.slug,
        categoryName: category.nameRu,
        brand: product.brand,
        unit: product.unit,
        priceDirams: best.customerPriceDirams.toString(),
        minOrderQty: best.minOrderQty,
        stockQty: Math.max(0, Number(best.stockQty) - Number(best.reservedQty)).toString(),
        offerId: best.id,
        offerCount: offers.length,
        leadTimeDays: best.leadTimeDays,
        keyAttributes: attrs
          .filter((a) => a.productId === product.id)
          .slice(0, 3)
          .map((a) => displayAttribute(category.slug, a)),
        imageKey: image ? `/api/files/${image.fileId}` : null,
        imageUrl: image ? `/api/files/${image.fileId}` : null,
      },
    ];
  });
  const brands = query.brands?.filter(Boolean) ?? (query.brand ? [query.brand] : []);
  const selected = Object.fromEntries(
    Object.entries(query.attributes ?? {}).map(([key, value]) => [
      canonicalKey(key),
      (Array.isArray(value) ? value : [value]).filter(Boolean),
    ]),
  );
  if (query.attributeName && query.attributeValue)
    selected[canonicalKey(query.attributeName)] = [query.attributeValue];
  const min = query.minPrice && /^\d+$/.test(query.minPrice) ? BigInt(query.minPrice) : null;
  const max = query.maxPrice && /^\d+$/.test(query.maxPrice) ? BigInt(query.maxPrice) : null;
  const matches = (item: PublicProduct, exclude?: string) => {
    if (query.inStock && Number(item.stockQty) < Number(item.minOrderQty)) return false;
    if (
      (min !== null && BigInt(item.priceDirams) < min) ||
      (max !== null && BigInt(item.priceDirams) > max)
    )
      return false;
    if (exclude !== "brand" && brands.length && (!item.brand || !brands.includes(item.brand)))
      return false;
    if (
      !Object.entries(ranges).every(
        ([key, bounds]) =>
          key === exclude ||
          attrs.some((attribute) => {
            if (attribute.productId !== item.id || attribute.name !== key) return false;
            const value = attributeNumber(attribute.value);
            return (
              value !== undefined &&
              (bounds.min === undefined || value >= bounds.min) &&
              (bounds.max === undefined || value <= bounds.max)
            );
          }),
      )
    )
      return false;
    return Object.entries(selected).every(
      ([key, values]) =>
        key === exclude ||
        !values.length ||
        attrs.some((a) => a.productId === item.id && a.name === key && values.includes(a.value)),
    );
  };
  const definitions = [...fieldDefinitions];
  if (!categoryIsParent)
    for (const name of new Set(attrs.map((attribute) => attribute.name)))
      if (!definitions.some((field) => field.key === name))
        definitions.push({ key: name, label: name, type: "checkbox" });
  const facets: SmartFilterFacetGroup[] = definitions.flatMap((definition) => {
    const eligible = new Set(
      candidates.filter((item) => matches(item, definition.key)).map((item) => item.id),
    );
    const counts = new Map<string, Set<string>>();
    const populated = new Set<string>();
    for (const attribute of attrs)
      if (attribute.name === definition.key && eligible.has(attribute.productId)) {
        const ids = counts.get(attribute.value) ?? new Set<string>();
        ids.add(attribute.productId);
        counts.set(attribute.value, ids);
        populated.add(attribute.productId);
      }
    const active = !!selected[definition.key]?.length || !!ranges[definition.key];
    if (!active && (counts.size < 2 || populated.size / Math.max(1, eligible.size) < 0.2))
      return [];
    const values = new Set([...counts.keys(), ...(selected[definition.key] ?? [])]);
    const numeric = [...counts.keys()]
      .map((value) => attributeNumber(value))
      .filter((value): value is number => value !== undefined);
    const type =
      definition.type === "range" && numeric.length
        ? "range"
        : definition.type === "range"
          ? "checkbox"
          : definition.type;
    return [
      {
        key: definition.key,
        label: definition.label,
        type,
        unit: definition.unit,
        isExtra: definition.isExtra,
        ...(type === "range" ? { min: Math.min(...numeric), max: Math.max(...numeric) } : {}),
        options: [...values].map((value) => ({ value, count: counts.get(value)?.size ?? 0 })),
      },
    ];
  });
  const items = candidates.filter((i) => matches(i));
  const priceCompare = (a: PublicProduct, b: PublicProduct) =>
    BigInt(a.priceDirams) < BigInt(b.priceDirams)
      ? -1
      : BigInt(a.priceDirams) > BigInt(b.priceDirams)
        ? 1
        : 0;
  if (query.sort === "price_asc") items.sort(priceCompare);
  else if (query.sort === "price_desc") items.sort((a, b) => priceCompare(b, a));
  else if (query.sort === "name") items.sort((a, b) => a.name.localeCompare(b.name, "ru"));
  if (query.diverse) {
    const groups = new Map<string, PublicProduct[]>();
    for (const item of items) {
      const group = groups.get(item.categoryId) ?? [];
      group.push(item);
      groups.set(item.categoryId, group);
    }
    const varied: PublicProduct[] = [];
    let available = true;
    while (available) {
      available = false;
      for (const group of groups.values()) {
        const item = group.shift();
        if (item) {
          varied.push(item);
          available = true;
        }
      }
    }
    items.splice(0, items.length, ...varied);
  }
  const total = items.length;
  const pageSize = Number.isFinite(query.pageSize)
    ? Math.min(100, Math.max(1, Math.floor(query.pageSize!)))
    : 24;
  const page = Number.isFinite(query.page)
    ? Math.min(Math.max(1, Math.ceil(total / pageSize)), Math.max(1, Math.floor(query.page!)))
    : 1;
  const brandCounts = new Map<string, number>();
  for (const item of candidates.filter((i) => matches(i, "brand")))
    if (item.brand) brandCounts.set(item.brand, (brandCounts.get(item.brand) ?? 0) + 1);
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    pageSize,
    brands: [...new Set([...brandCounts.keys(), ...brands])].sort(),
    brandFacets: [...brandCounts].map(([value, count]) => ({ value, count })),
    attributeValues: [...new Set(attrs.filter((a) => a.name === "Назначение").map((a) => a.value))],
    facets,
  };
}

export async function getPublicProduct(slug: string) {
  const db = await getDb();
  const [row] = await db
    .select({ product: products, category: categories })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        eq(products.slug, slug),
        eq(products.status, "PUBLISHED"),
        sql`${categories.id} in (${visibleCategoryIds})`,
      ),
    )
    .limit(1);

  if (!row) return null;

  const [offerRows, attributes, images] = await Promise.all([
    db
      .select({
        offer: supplierOffers,
        supplierName: suppliers.name,
        supplierPhone: suppliers.phone,
      })
      .from(supplierOffers)
      .innerJoin(suppliers, eq(supplierOffers.supplierId, suppliers.id))
      .where(
        and(
          eq(supplierOffers.productId, row.product.id),
          eq(supplierOffers.isActive, "true"),
          eq(suppliers.status, "ACTIVE"),
        ),
      ),
    db.select().from(productAttributes).where(eq(productAttributes.productId, row.product.id)),
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, row.product.id))
      .orderBy(asc(productImages.sort)),
  ]);

  const offers = retailOffers(offerRows.map(({ offer }) => offer));
  offers.sort((a, b) => {
    const stocked = (offer: typeof a) =>
      Number(offer.stockQty) - Number(offer.reservedQty) >= Number(offer.minOrderQty);
    return (
      Number(stocked(b)) - Number(stocked(a)) ||
      (a.customerPriceDirams < b.customerPriceDirams
        ? -1
        : a.customerPriceDirams > b.customerPriceDirams
          ? 1
          : 0)
    );
  });

  const relatedProducts = (await listCatalog({ category: row.category.slug, pageSize: 5 })).items
    .filter((product) => product.id !== row.product.id)
    .slice(0, 4);

  return {
    ...row,
    attributes: attributes.map((attribute) => ({
      ...attribute,
      ...displayAttribute(row.category.slug, attribute),
    })),
    images,
    relatedProducts,
    offers: offers.map((offer) => {
      const sup = offerRows.find((r) => r.offer.id === offer.id);
      return {
        id: offer.id,
        supplierName: sup?.supplierName ?? "Поставщик",
        supplierPhone: sup?.supplierPhone,
        priceDirams: offer.customerPriceDirams.toString(),
        stockQty: Math.max(0, Number(offer.stockQty) - Number(offer.reservedQty)).toString(),
        minOrderQty: offer.minOrderQty,
        leadTimeDays: offer.leadTimeDays,
      };
    }),
  };
}

export async function searchSuggestions(q: string) {
  if (q.trim().length < 2) return [];
  const db = await getDb();
  return db
    .select({ name: products.nameRu, slug: products.slug })
    .from(products)
    .where(
      and(
        eq(products.status, "PUBLISHED"),
        sql`${products.categoryId} in (${visibleCategoryIds})`,
        or(ilike(products.nameRu, `%${q}%`), sql`similarity(${products.nameRu}, ${q}) > 0.12`),
      ),
    )
    .orderBy(desc(sql`similarity(${products.nameRu}, ${q})`))
    .limit(7);
}

export async function listCategories(options: { includeInactive?: boolean } = {}) {
  const db = await getDb();
  return db
    .select()
    .from(categories)
    .where(options.includeInactive ? undefined : sql`${categories.id} in (${visibleCategoryIds})`)
    .orderBy(asc(categories.sort), asc(categories.nameRu));
}

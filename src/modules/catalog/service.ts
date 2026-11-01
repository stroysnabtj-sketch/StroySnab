import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, productAttributes, productImages, products, supplierOffers, suppliers } from "@/db/schema";
import { priceOffers } from "@/modules/pricing/service";
import type { CatalogQuery, PublicProduct } from "./types";

export async function listCatalog(query: CatalogQuery) {
  const db = await getDb();
  const search = query.q?.trim();
  const conditions = [eq(products.status, "PUBLISHED"), eq(categories.isActive, "true")];
  if (query.category) {
    const [selected] = await db.select().from(categories).where(eq(categories.slug, query.category)).limit(1);
    if (selected && !selected.parentId) {
      const children = await db.select({ id: categories.id }).from(categories).where(eq(categories.parentId, selected.id));
      conditions.push(inArray(products.categoryId, [selected.id, ...children.map((child) => child.id)]));
    } else if (selected) conditions.push(eq(products.categoryId, selected.id));
    else conditions.push(eq(products.id, "00000000-0000-0000-0000-000000000000"));
  }
  if (query.brand) conditions.push(eq(products.brand, query.brand));
  if (query.attributeName && query.attributeValue) conditions.push(sql`exists (select 1 from ${productAttributes} where ${productAttributes.productId} = ${products.id} and ${productAttributes.name} = ${query.attributeName} and ${productAttributes.value} = ${query.attributeValue})`);
  if (search) conditions.push(sql`(to_tsvector('russian', coalesce(${products.nameRu}, '') || ' ' || coalesce(${products.descriptionRu}, '') || ' ' || coalesce(${products.brand}, '')) @@ plainto_tsquery('russian', ${search}) OR similarity(${products.nameRu}, ${search}) > 0.12 OR ${products.nameRu} ILIKE ${`%${search}%`} OR ${products.sku} ILIKE ${`%${search}%`})`);
  const rows = await db.select({ product: products, category: categories }).from(products).innerJoin(categories, eq(products.categoryId, categories.id)).where(and(...conditions));
  const offerRows = rows.length ? await db.select({ offer: supplierOffers, supplier: suppliers }).from(supplierOffers).innerJoin(suppliers, eq(supplierOffers.supplierId, suppliers.id)).where(and(eq(supplierOffers.isActive, "true"), eq(suppliers.status, "ACTIVE"))) : [];
  const priced = await priceOffers(offerRows.map(({ offer, supplier }) => ({ ...offer, categoryId: rows.find((row) => row.product.id === offer.productId)?.product.categoryId ?? "", supplierStatus: supplier.status })), db);
  const byProduct = new Map<string, typeof priced>();
  for (const offer of priced) { const list = byProduct.get(offer.productId) ?? []; list.push(offer); byProduct.set(offer.productId, list); }
  let items: PublicProduct[] = rows.flatMap(({ product, category }) => {
    const offers = (byProduct.get(product.id) ?? []).sort((a, b) => a.customerPriceDirams < b.customerPriceDirams ? -1 : 1);
    const best = offers.find((offer) => Number(offer.stockQty) > Number(offer.reservedQty)) ?? offers[0];
    if (!best) return [];
    return [{ id: product.id, sku: product.sku, slug: product.slug, name: product.nameRu, description: product.descriptionRu, categoryId: category.id, categorySlug: category.slug, categoryName: category.nameRu, brand: product.brand, unit: product.unit, priceDirams: best.customerPriceDirams.toString(), stockQty: (Number(best.stockQty) - Number(best.reservedQty)).toString(), offerId: best.id, offerCount: offers.length, leadTimeDays: best.leadTimeDays }];
  });
  if (query.inStock) items = items.filter((item) => Number(item.stockQty) > 0);
  const min = query.minPrice ? BigInt(query.minPrice) : null; const max = query.maxPrice ? BigInt(query.maxPrice) : null;
  if (min !== null) items = items.filter((item) => BigInt(item.priceDirams) >= min);
  if (max !== null) items = items.filter((item) => BigInt(item.priceDirams) <= max);
  if (query.sort === "price_asc") items.sort((a, b) => BigInt(a.priceDirams) < BigInt(b.priceDirams) ? -1 : 1);
  else if (query.sort === "price_desc") items.sort((a, b) => BigInt(a.priceDirams) > BigInt(b.priceDirams) ? -1 : 1);
  else if (query.sort === "name") items.sort((a, b) => a.name.localeCompare(b.name, "ru"));
  const attributeValues = await db.selectDistinct({ value: productAttributes.value }).from(productAttributes).where(eq(productAttributes.name, "Назначение")).orderBy(productAttributes.value);
  const total = items.length; const page = Math.max(1, query.page ?? 1); const pageSize = Math.min(48, Math.max(1, query.pageSize ?? 24));
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, brands: [...new Set(rows.map((row) => row.product.brand).filter((value): value is string => Boolean(value)))].sort(), attributeValues: attributeValues.map((item) => item.value) };
}

export async function getPublicProduct(slug: string) {
  const db = await getDb();
  const [row] = await db.select({ product: products, category: categories }).from(products).innerJoin(categories, eq(products.categoryId, categories.id)).where(and(eq(products.slug, slug), eq(products.status, "PUBLISHED"))).limit(1);
  if (!row) return null;
  const [offerRows, attributes, images] = await Promise.all([
    db.select({ offer: supplierOffers, supplierName: suppliers.name }).from(supplierOffers).innerJoin(suppliers, eq(supplierOffers.supplierId, suppliers.id)).where(and(eq(supplierOffers.productId, row.product.id), eq(supplierOffers.isActive, "true"), eq(suppliers.status, "ACTIVE"))),
    db.select().from(productAttributes).where(eq(productAttributes.productId, row.product.id)),
    db.select().from(productImages).where(eq(productImages.productId, row.product.id)).orderBy(asc(productImages.sort)),
  ]);
  const offers = await priceOffers(offerRows.map(({ offer }) => ({ ...offer, categoryId: row.product.categoryId })), db);
  offers.sort((a, b) => a.customerPriceDirams < b.customerPriceDirams ? -1 : 1);
  return { ...row, attributes, images, offers: offers.map((offer) => ({ id: offer.id, supplierName: offerRows.find((row) => row.offer.id === offer.id)?.supplierName ?? "Поставщик", priceDirams: offer.customerPriceDirams.toString(), stockQty: (Number(offer.stockQty) - Number(offer.reservedQty)).toString(), minOrderQty: offer.minOrderQty, leadTimeDays: offer.leadTimeDays })) };
}

export async function searchSuggestions(q: string) {
  if (q.trim().length < 2) return [];
  const db = await getDb();
  return db.select({ name: products.nameRu, slug: products.slug }).from(products).where(and(eq(products.status, "PUBLISHED"), or(ilike(products.nameRu, `%${q}%`), sql`similarity(${products.nameRu}, ${q}) > 0.12`))).orderBy(desc(sql`similarity(${products.nameRu}, ${q})`)).limit(7);
}

export async function listCategories() { const db = await getDb(); return db.select().from(categories).orderBy(asc(categories.sort), asc(categories.nameRu)); }

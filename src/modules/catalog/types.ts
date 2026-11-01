export type PublicProduct = {
  id: string; sku: string; slug: string; name: string; description: string | null; categoryId: string; categorySlug: string; categoryName: string; brand: string | null; unit: string; priceDirams: string; stockQty: string; offerId: string; offerCount: number; leadTimeDays: number;
};
export type CatalogQuery = { q?: string; category?: string; brand?: string; minPrice?: string; maxPrice?: string; inStock?: boolean; attributeName?: string; attributeValue?: string; sort?: string; page?: number; pageSize?: number };

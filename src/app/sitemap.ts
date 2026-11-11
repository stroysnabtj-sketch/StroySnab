import type { MetadataRoute } from "next";
import { getDb } from "@/db";
import { products, categories } from "@/db/schema";
import { and, asc, eq, sql } from "drizzle-orm";
import { visibleCategoryIds } from "@/modules/catalog/category-visibility";
import { publicSiteOrigin } from "@/modules/system/site-url";
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicSiteOrigin();
  const db = await getDb();
  const [items, cats] = await Promise.all([
    db
      .select({ slug: products.slug, updatedAt: products.updatedAt })
      .from(products)
      .where(
        and(
          eq(products.status, "PUBLISHED"),
          sql`${products.categoryId} in (${visibleCategoryIds})`,
        ),
      )
      .orderBy(asc(products.slug)),
    db
      .select({ slug: categories.slug })
      .from(categories)
      .where(sql`${categories.id} in (${visibleCategoryIds})`)
      .orderBy(asc(categories.slug)),
  ]);
  const staticPages: MetadataRoute.Sitemap = [
    "/",
    "/catalog",
    "/delivery",
    "/contacts",
    "/terms",
    "/privacy",
  ].map((path) => ({ url: `${base}${path}` }));
  return staticPages.concat(
    items.map((item) => ({
      url: `${base}/product/${encodeURIComponent(item.slug)}`,
      lastModified: item.updatedAt,
    })),
    cats.map((cat) => ({ url: `${base}/catalog/${encodeURIComponent(cat.slug)}` })),
  );
}

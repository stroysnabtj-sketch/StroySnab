import type { MetadataRoute } from "next";
import { getDb } from "@/db";
import { products, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL ?? "http://localhost:3000"; const db = await getDb();
  const [items, cats] = await Promise.all([db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).where(eq(products.status, "PUBLISHED")), db.select({ slug: categories.slug }).from(categories).where(eq(categories.isActive, "true"))]);
  const staticPages: MetadataRoute.Sitemap = ["", "/catalog", "/delivery", "/contacts", "/terms", "/privacy"].map((path) => ({ url: `${base}${path}`, changeFrequency: "weekly", priority: path === "" ? 1 : .6 }));
  return staticPages.concat(items.map((item) => ({ url: `${base}/product/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "daily", priority: .8 })), cats.map((cat) => ({ url: `${base}/catalog/${cat.slug}`, changeFrequency: "weekly", priority: .7 })));
}

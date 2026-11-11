import { afterEach, describe, expect, it, vi } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";

afterEach(() => vi.unstubAllEnvs());

describe("public search engine files", () => {
  it("never uses localhost or deployment hosts as the production indexing fallback", async () => {
    vi.stubEnv("SITE_URL", undefined);
    vi.stubEnv("APP_URL", "http://localhost:3000");
    vi.stubEnv("NODE_ENV", "production");
    expect(robots().sitemap).toBe("https://www.stroysnab.tj/sitemap.xml");
    expect(
      (await sitemap()).every((entry) => entry.url.startsWith("https://www.stroysnab.tj/")),
    ).toBe(true);
  });

  it("uses the public domain without double slashes despite an old application URL", async () => {
    vi.stubEnv("SITE_URL", "https://www.stroysnab.tj///");
    vi.stubEnv("APP_URL", "https://old-deployment.up.railway.app/");
    const urls = (await sitemap()).map((entry) => new URL(entry.url));
    expect(urls.length).toBeGreaterThan(6);
    expect(urls.every((url) => url.origin === "https://www.stroysnab.tj")).toBe(true);
    expect(urls.every((url) => !url.pathname.includes("//"))).toBe(true);
    expect(urls.some((url) => url.pathname.startsWith("/product/"))).toBe(true);
    expect(urls.some((url) => url.pathname.startsWith("/catalog/"))).toBe(true);
    expect(robots().sitemap).toBe("https://www.stroysnab.tj/sitemap.xml");
  });

  it("does not expose categories or published products beneath a hidden parent", async () => {
    const db = await getDb();
    const tag = `seo-${Date.now()}`;
    const [parent] = await db
      .insert(categories)
      .values({ slug: `${tag}-parent`, nameRu: "SEO hidden", isActive: "false" })
      .returning();
    const [child] = await db
      .insert(categories)
      .values({ slug: `${tag}-child`, nameRu: "SEO child", parentId: parent.id, isActive: "true" })
      .returning();
    const [item] = await db
      .insert(products)
      .values({
        sku: tag,
        slug: `${tag}-product`,
        nameRu: "Hidden SEO item",
        categoryId: child.id,
        unit: "шт",
        status: "PUBLISHED",
      })
      .returning();
    const entries = await sitemap();
    expect(entries.some((entry) => entry.url.includes(child.slug))).toBe(false);
    expect(entries.some((entry) => entry.url.includes(item.slug))).toBe(false);
  });
});

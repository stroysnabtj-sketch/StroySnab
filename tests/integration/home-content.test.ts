import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { defaultHomeContent, homeContentSchema } from "@/modules/merchandising/home-content";
import { getHomeContent, saveHomeContent } from "@/modules/merchandising/home-content-service";
import type { SessionUser } from "@/modules/auth/session";
import { listCatalog } from "@/modules/catalog/service";
import { uploadHomeImage, readHomeImage } from "@/modules/merchandising/home-images";
import sharp from "sharp";

describe("homepage content management", () => {
  it("rejects script, protocol-relative, cross-site and non-product advertising links", () => {
    for (const href of [
      "javascript:alert(1)",
      "//evil.test",
      "https://evil.test/product/a",
      "/admin",
      "/product/a?redirect=https://evil.test",
    ])
      expect(
        homeContentSchema.safeParse({
          ...defaultHomeContent,
          ads: [
            {
              id: randomUUID(),
              title: "Товар",
              href,
              image: "",
              buttonLabel: "Подробнее",
              active: true,
            },
          ],
        }).success,
      ).toBe(false);
  });
  it("accepts product URLs on our public domain and rejects oversized or duplicate placements", () => {
    const ad = {
      id: randomUUID(),
      title: "Товар",
      href: "https://www.stroysnab.tj/product/test",
      image: "",
      buttonLabel: "Подробнее",
      active: true,
    };
    expect(homeContentSchema.parse({ ...defaultHomeContent, ads: [ad] }).ads[0].href).toBe(
      "/product/test",
    );
    expect(homeContentSchema.safeParse({ ...defaultHomeContent, ads: [ad, ad] }).success).toBe(
      false,
    );
    expect(
      homeContentSchema.safeParse({
        ...defaultHomeContent,
        ads: Array.from({ length: 7 }, () => ({ ...ad, id: randomUUID() })),
      }).success,
    ).toBe(false);
    expect(
      homeContentSchema.safeParse({
        ...defaultHomeContent,
        hero: { ...defaultHomeContent.hero, image: "https://evil.test/image.png" },
      }).success,
    ).toBe(false);
  });
  it("restricts edits to catalog staff and persists content without publishing disabled ads", async () => {
    const db = await getDb();
    const actor: SessionUser = {
      id: (await db.select({ id: users.id }).from(users).limit(1))[0].id,
      role: "CONTENT_MANAGER",
      email: null,
      phone: "",
    };
    const original = await getHomeContent();
    await expect(
      saveHomeContent({ ...actor, role: "SUPPLIER_OWNER" }, defaultHomeContent),
    ).rejects.toThrow("Недостаточно прав");
    await expect(
      saveHomeContent({ ...actor, role: "CUSTOMER" }, defaultHomeContent),
    ).rejects.toThrow("Недостаточно прав");
    try {
      const updated = {
        ...defaultHomeContent,
        hero: { ...defaultHomeContent.hero, title: "Материалы\nдля стройки" },
        ads: [
          {
            id: randomUUID(),
            title: "Размещение",
            href: "/product/test",
            image: "",
            mobileImage: "",
            buttonLabel: "Смотреть товар",
            active: false,
          },
        ],
      };
      await saveHomeContent(actor, updated);
      expect(await getHomeContent()).toEqual(updated);
      await expect(
        saveHomeContent(actor, { ...updated, ads: [{ ...updated.ads[0], active: true }] }),
      ).rejects.toThrow("не опубликован");
      const product = (await listCatalog({ pageSize: 1 })).items[0];
      const bytes = await sharp({
        create: { width: 20, height: 30, channels: 3, background: "#074089" },
      })
        .png()
        .toBuffer();
      const file = new File([new Uint8Array(bytes)], "banner.png", { type: "image/png" });
      await expect(uploadHomeImage({ ...actor, role: "CUSTOMER" }, file)).rejects.toThrow(
        "Недостаточно прав",
      );
      const uploaded = await uploadHomeImage(actor, file);
      const id = uploaded.url.split("/").pop()!;
      expect(await readHomeImage(id)).toBeNull();
      expect(await readHomeImage(id, actor)).not.toBeNull();
      const withMobile = {
        ...updated,
        hero: { ...updated.hero, mobileImage: uploaded.url },
        ads: [{ ...updated.ads[0], active: true, href: `/product/${product.slug}` }],
      };
      await saveHomeContent(actor, withMobile);
      expect((await getHomeContent()).hero.mobileImage).toBe(uploaded.url);
      expect((await readHomeImage(id))?.mime).toBe("image/webp");
      await saveHomeContent(actor, updated);
      expect(await readHomeImage(id)).toBeNull();
    } finally {
      await saveHomeContent(actor, original);
    }
  });
});

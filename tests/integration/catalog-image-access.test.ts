import { expect, it, vi } from "vitest";
import { eq, inArray } from "drizzle-orm";
import sharp from "sharp";
import { getDb } from "@/db";
import { categories, files, productImages, products, supplierUsers, users } from "@/db/schema";
import { GET } from "@/app/api/files/[id]/route";
import { optionalUser, type SessionUser } from "@/modules/auth/session";
import { uploadProductImage } from "@/modules/catalog/image-service";
import { uploadShopImage } from "@/modules/suppliers/shop-service";

vi.mock("@/modules/auth/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/auth/session")>()),
  optionalUser: vi.fn(),
}));
vi.mock("@/server/storage", () => ({
  getStorage: () => ({
    get: async () => Buffer.from("photo"),
    put: async () => {},
    delete: async () => {},
  }),
  newImageKey: () => `products/${crypto.randomUUID()}.webp`,
}));

it("serves only visible photos publicly and limits private previews to the relevant shop or staff", async () => {
  const db = await getDb();
  const sellers = await db
    .select({
      id: users.id,
      role: users.role,
      phone: users.phone,
      email: users.email,
      supplierId: supplierUsers.supplierId,
    })
    .from(supplierUsers)
    .innerJoin(users, eq(users.id, supplierUsers.userId));
  const owner = sellers[0];
  const other = sellers.find((seller) => seller.supplierId !== owner.supplierId)!;
  const tag = crypto.randomUUID();
  const [category] = await db
    .insert(categories)
    .values({ slug: tag, nameRu: "Тест фото" })
    .returning();
  const [product] = await db
    .insert(products)
    .values({
      sku: tag,
      slug: tag,
      nameRu: "Черновик",
      categoryId: category.id,
      unit: "шт.",
      createdBySupplierId: owner.supplierId,
    })
    .returning();
  const [file] = await db
    .insert(files)
    .values({ storageKey: `products/${tag}.webp`, size: 5, mime: "image/webp" })
    .returning();
  await db.insert(productImages).values({ productId: product.id, fileId: file.id });
  const uploadedFileIds: string[] = [];
  const request = (preview = false) =>
    GET(new Request(`http://localhost/api/files/${file.id}${preview ? "?preview=1" : ""}`), {
      params: Promise.resolve({ id: file.id }),
    });
  try {
    vi.mocked(optionalUser).mockResolvedValue(null);
    expect((await request()).status).toBe(404);
    expect((await request(true)).status).toBe(404);
    vi.mocked(optionalUser).mockResolvedValue(other as SessionUser);
    expect((await request(true)).status).toBe(404);
    vi.mocked(optionalUser).mockResolvedValue(owner as SessionUser);
    expect((await request()).status).toBe(404);
    const preview = await request(true);
    expect(preview.status).toBe(200);
    expect(preview.headers.get("cache-control")).toBe("private, no-store");
    vi.mocked(optionalUser).mockResolvedValue({ ...other, role: "CONTENT_MANAGER" });
    expect((await request(true)).status).toBe(200);
    await db.update(products).set({ status: "PUBLISHED" }).where(eq(products.id, product.id));
    vi.mocked(optionalUser).mockResolvedValue(null);
    expect((await request()).status).toBe(200);
    await db.update(categories).set({ isActive: "false" }).where(eq(categories.id, category.id));
    expect((await request()).status).toBe(404);
    await db.update(categories).set({ isActive: "true" }).where(eq(categories.id, category.id));
    const png = await sharp({ create: { width: 1, height: 1, channels: 3, background: "white" } })
      .png()
      .toBuffer();
    const imageFile = new File([new Uint8Array(png)], "image.png", { type: "image/png" });
    const adminImage = await uploadProductImage(
      { ...other, role: "SUPER_ADMIN" },
      product.id,
      imageFile,
    );
    uploadedFileIds.push(adminImage.fileId);
    expect((await request()).status).toBe(200);
    const image = await uploadShopImage(owner as SessionUser, product.id, imageFile);
    uploadedFileIds.push(image.fileId);
    expect((await request()).status).toBe(404);
    vi.mocked(optionalUser).mockResolvedValue(owner as SessionUser);
    expect(
      (
        await GET(new Request(`http://localhost${image.url}`), {
          params: Promise.resolve({ id: image.fileId }),
        })
      ).status,
    ).toBe(200);
  } finally {
    if (uploadedFileIds.length) await db.delete(files).where(inArray(files.id, uploadedFileIds));
    await db.delete(files).where(eq(files.id, file.id));
    await db.delete(products).where(eq(products.id, product.id));
    await db.delete(categories).where(eq(categories.id, category.id));
  }
});

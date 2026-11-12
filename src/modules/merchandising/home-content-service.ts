import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { settings } from "@/db/schema/system";
import type { SessionUser } from "@/modules/auth/session";
import { hasPermission } from "@/modules/rbac/permissions";
import { ApiError } from "@/server/api-error";
import { writeAudit } from "@/modules/audit/service";
import { getPublicProduct } from "@/modules/catalog/service";
import { defaultHomeContent, homeContentSchema } from "./home-content";

const key = "storefront.home-content.v1";
export async function getHomeContent() {
  const db = await getDb();
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, key));
  if (!row) return structuredClone(defaultHomeContent);
  return homeContentSchema.parse(row.value);
}
export async function saveHomeContent(actor: SessionUser, input: unknown, ip?: string | null) {
  if (!hasPermission(actor.role, "catalog:manage"))
    throw new ApiError(403, "forbidden", "Недостаточно прав");
  const content = homeContentSchema.parse(input);
  for (const ad of content.ads.filter((item) => item.active)) {
    const product = await getPublicProduct(ad.href.split("/").pop()!, false);
    if (!product || !product.offers.length)
      throw new ApiError(
        400,
        "validation_failed",
        `Товар для размещения «${ad.title}» не опубликован или недоступен`,
      );
  }
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx
      .insert(settings)
      .values({ key, value: content })
      .onConflictDoUpdate({ target: settings.key, set: { value: content, updatedAt: new Date() } });
    await writeAudit(tx, {
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "home_content.updated",
      entity: "settings",
      data: { key, placementIds: content.ads.map((ad) => ad.id) },
      ip,
    });
  });
  return content;
}

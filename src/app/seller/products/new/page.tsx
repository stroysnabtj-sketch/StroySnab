import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { categories } from "@/db/schema";
import { Workspace } from "@/components/workspace";
import { SellerProductEditor } from "@/components/seller-product-editor";
import { requirePageUser } from "@/modules/auth/page";
import { shopMembership } from "@/modules/suppliers/shop-service";
export const dynamic = "force-dynamic";
export default async function NewProductPage() {
  const actor = await requirePageUser(["SUPPLIER_OWNER", "SUPPLIER_STAFF"], "/seller/products/new");
  await shopMembership(actor);
  const db = await getDb(); const items = await db.select().from(categories).where(and(eq(categories.isActive,"true"))).orderBy(asc(categories.nameRu));
  return <Workspace kind="seller"><SellerProductEditor categories={items}/></Workspace>;
}

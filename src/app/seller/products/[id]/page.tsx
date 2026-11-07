import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { categories } from "@/db/schema";
import { Workspace } from "@/components/workspace";
import { SellerProductEditor } from "@/components/seller-product-editor";
import { requirePageUser } from "@/modules/auth/page";
import { getShopProduct } from "@/modules/suppliers/shop-service";
import { ApiError } from "@/server/api-error";
export const dynamic = "force-dynamic";
export default async function EditProductPage({params}:{params:Promise<{id:string}>}) {
  const {id} = await params; const actor = await requirePageUser(["SUPPLIER_OWNER", "SUPPLIER_STAFF"], `/seller/products/${id}`);
  let product; try { product = await getShopProduct(actor,id); } catch(error) { if(error instanceof ApiError && error.status === 404) notFound(); throw error; }
  const db = await getDb(); const items = await db.select().from(categories).where(eq(categories.isActive,"true")).orderBy(asc(categories.nameRu));
  return <Workspace kind="seller"><SellerProductEditor initial={product} categories={items}/></Workspace>;
}

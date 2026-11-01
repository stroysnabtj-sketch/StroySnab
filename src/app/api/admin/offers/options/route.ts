import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { requireUser } from "@/modules/auth/session";
import { errorResponse } from "@/server/api-error";
export async function GET() { try { await requireUser("suppliers:manage"); const db = await getDb(); return NextResponse.json({ products: await db.select({ id: products.id, sku: products.sku, name: products.nameRu, categoryId: products.categoryId }).from(products).orderBy(asc(products.nameRu)), categories: await db.select().from(categories).orderBy(asc(categories.sort)) }); } catch (error) { return errorResponse(error); } }

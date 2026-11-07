import { requireUser } from '@/modules/auth/session';
import { getDb } from '@/db';
import { supplierOffers,products,suppliers } from '@/db/schema';
import { and,eq,ilike,or,sql } from 'drizzle-orm';
import { visibleCategoryIds } from '@/modules/catalog/category-visibility';
import { errorResponse } from '@/server/api-error';
import { jsonResponse } from '@/server/json';
export async function GET(request:Request){try{await requireUser('product_requests:manage');const q=(new URL(request.url).searchParams.get('q')??'').trim().slice(0,200);const db=await getDb();return jsonResponse({items:await db.select({id:supplierOffers.id,productName:products.nameRu,supplierName:suppliers.name,supplierPriceDirams:supplierOffers.supplierPriceDirams,stockQty:supplierOffers.stockQty,reservedQty:supplierOffers.reservedQty,isActive:supplierOffers.isActive,minOrderQty:supplierOffers.minOrderQty,leadTimeDays:supplierOffers.leadTimeDays,unit:products.unit}).from(supplierOffers).innerJoin(products,eq(products.id,supplierOffers.productId)).innerJoin(suppliers,eq(suppliers.id,supplierOffers.supplierId)).where(and(eq(supplierOffers.isActive,'true'),eq(products.status,'PUBLISHED'),eq(suppliers.status,'ACTIVE'),sql`${products.categoryId} IN (${visibleCategoryIds})`,q?or(ilike(products.nameRu,`%${q}%`),ilike(products.sku,`%${q}%`)):undefined)).limit(25)});}catch(e){return errorResponse(e);}}


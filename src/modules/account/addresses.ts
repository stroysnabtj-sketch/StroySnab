import {and,asc,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db";
import {customers,addresses} from "@/db/schema";
import {ApiError} from "@/server/api-error";
const input=z.object({id:z.uuid().optional(),label:z.string().trim().min(1).max(60),city:z.string().trim().min(2).max(100),street:z.string().trim().min(5).max(500),details:z.string().trim().max(500).optional(),lat:z.number().finite().min(-90).max(90),lng:z.number().finite().min(-180).max(180),isDefault:z.boolean().optional()});
async function customerId(userId:string){const [row]=await(await getDb()).select({id:customers.id}).from(customers).where(eq(customers.userId,userId)).limit(1);if(!row)throw new ApiError(403,"customer_required","Доступно покупателю");return row.id;}
export async function listAddresses(userId:string){const id=await customerId(userId);const rows=await(await getDb()).select().from(addresses).where(eq(addresses.customerId,id)).orderBy(asc(addresses.label),asc(addresses.id));return rows.map(r=>({id:r.id,label:r.label,city:r.city,street:r.street,details:r.details,lat:r.lat===null?null:Number(r.lat),lng:r.lng===null?null:Number(r.lng),isDefault:r.isDefault==="true"}));}
export type SavedAddress=Awaited<ReturnType<typeof listAddresses>>[number];
export async function saveAddress(userId:string,raw:unknown){const data=input.parse(raw),owner=await customerId(userId),db=await getDb();return db.transaction(async tx=>{
 await tx.select({id:customers.id}).from(customers).where(eq(customers.id,owner)).for("update");
 const existing=await tx.select().from(addresses).where(eq(addresses.customerId,owner));
 if(data.id&&!existing.some(v=>v.id===data.id))throw new ApiError(404,"not_found","Адрес не найден");
 if(!data.id&&existing.length>=20)throw new ApiError(400,"address_limit","Можно сохранить до 20 адресов");
 const isDefault=data.isDefault??(data.id?existing.find(v=>v.id===data.id)?.isDefault==="true":existing.length===0);
 if(isDefault)await tx.update(addresses).set({isDefault:"false"}).where(eq(addresses.customerId,owner));
 const values={label:data.label,city:data.city,street:data.street,details:data.details||null,lat:data.lat.toFixed(6),lng:data.lng.toFixed(6),isDefault:isDefault?"true":"false"};
 const [saved]=data.id?await tx.update(addresses).set(values).where(and(eq(addresses.id,data.id),eq(addresses.customerId,owner))).returning({id:addresses.id}):await tx.insert(addresses).values({...values,customerId:owner}).returning({id:addresses.id});return saved;
});}
export async function deleteAddress(userId:string,id:string){z.uuid().parse(id);const owner=await customerId(userId),db=await getDb();await db.transaction(async tx=>{
 await tx.select({id:customers.id}).from(customers).where(eq(customers.id,owner)).for("update");
 const [removed]=await tx.delete(addresses).where(and(eq(addresses.id,id),eq(addresses.customerId,owner))).returning();if(!removed)throw new ApiError(404,"not_found","Адрес не найден");
 if(removed.isDefault==="true"){const [next]=await tx.select().from(addresses).where(eq(addresses.customerId,owner)).orderBy(asc(addresses.id)).limit(1);if(next)await tx.update(addresses).set({isDefault:"true"}).where(eq(addresses.id,next.id));}
});}

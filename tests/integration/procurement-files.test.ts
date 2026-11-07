import { it,expect } from 'vitest';
import { importList,validateListFile,attachList,readList } from '@/modules/procurement/files';
import { createProcurementRequest,saveQuotation } from '@/modules/procurement/service';
import { quotationPdf } from '@/modules/procurement/pdf';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { SessionUser } from '@/modules/auth/session';
import { writeFile,mkdir } from 'node:fs/promises';
it('imports structured lists, rejects disguised files, protects attachments and generates Cyrillic quotation PDF',async()=>{
 const file=new File(['Наименование,Количество,Единица\nЦемент,2,мешок\nКирпич,100,шт.'],'list.csv',{type:'text/csv'});expect(await importList(file)).toEqual([{name:'Цемент',qty:'2',unit:'мешок'},{name:'Кирпич',qty:'100',unit:'шт.'}]);await expect(validateListFile(new File(['<script>bad</script>'],'list.pdf'))).rejects.toThrow();
 const r=await createProcurementRequest({title:'Список материалов',contactName:'Покупатель',contactPhone:'900001199',lines:await importList(file)},null);const f=await attachList(r.id,null,r.accessToken!,file);await expect(readList(r.id,f.id,null,'wrong')).rejects.toThrow();expect((await readList(r.id,f.id,null,r.accessToken!)).bytes.toString()).toContain('Цемент');
 const db=await getDb();const [admin]=await db.select().from(users).where(eq(users.role,'SUPER_ADMIN'));await saveQuotation(r.id,admin as SessionUser,{version:0,send:true,validUntil:new Date(Date.now()+86400000).toISOString(),conditions:'Доставка по согласованию. Оплата по счёту.',lines:Array.from({length:40},(_,i)=>({name:`Строительный материал ${i+1} — цемент и кирпич`,qty:'2',unit:'шт.',basePriceDirams:'10000'}))});const pdf=await quotationPdf(r.id,null,r.accessToken!);expect(pdf.bytes.subarray(0,5).toString()).toBe('%PDF-');await mkdir('.data/procurement-evidence',{recursive:true});await writeFile('.data/procurement-evidence/quotation.pdf',pdf.bytes);
});

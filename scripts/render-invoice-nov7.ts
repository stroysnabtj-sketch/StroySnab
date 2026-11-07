import { renderOrderPdf, type InvoiceOrder } from "../src/modules/orders/pdf";
import { mkdir, writeFile } from "node:fs/promises";
async function main() {
 await mkdir("tmp/pdfs/invoice-nov7",{recursive:true});
 for (const count of [1,40,200]) {
 const items=Array.from({length:count},(_,i)=>({productName: `Материал ${i+1}: Кирпич керамический полнотелый М150 для наружных стен и перегородок, размер 250 × 120 × 65 мм${i===5?". Очень длинная характеристика ".repeat(8):""}`,unit:"шт.",qty:"2.500",priceDirams:"12345",subtotalDirams:"30863"}));
 const order: InvoiceOrder={orderNumber:`ORD-TEST-${count}`,createdAt:new Date("2026-11-07T07:00:00Z"),customerName:"Абдулло Саидов",customerPhone:"+992900001122",deliveryCity:"Душанбе",deliveryAddress:"улица Рудаки, дом 125, корпус 2, строительная площадка у северного въезда",vehicleType:"GAZELLE",items,deliveryTotalDirams:"25000",totalDirams:(30863n*BigInt(count)+25000n).toString()};
 const pdf=await renderOrderPdf(order);await writeFile(`tmp/pdfs/invoice-nov7/invoice-${count}.pdf`,pdf.bytes);
 }
}
main();

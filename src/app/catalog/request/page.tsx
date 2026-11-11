import { eq } from "drizzle-orm";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductRequestForm } from "@/components/product-request-form";
import { getDb } from "@/db";
import { customers } from "@/db/schema";
import { requirePageUser } from "@/modules/auth/page";
export const dynamic = "force-dynamic";
export const metadata = { title: "Заявка на отсутствующий товар", description: "Не нашли строительный материал? Оставьте заявку — менеджер проверит предложения поставщиков." };
export default async function ProductRequestPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product } = await searchParams;
  const destination = product ? `/catalog/request?product=${encodeURIComponent(product)}` : "/catalog/request";
  const user = await requirePageUser(["CUSTOMER"], destination);
  const [customer] = await (await getDb()).select().from(customers).where(eq(customers.userId, user.id)).limit(1);
  return <><SiteHeader /><main className="shell"><div className="request-layout"><section className="request-intro"><span className="eyebrow">Индивидуальная закупка</span><h1>Не нашли нужный материал?</h1><p>Опишите товар и количество. Мы передадим запрос активным поставщикам и вернёмся с ценой и сроком поставки.</p><p><Link className="button button-secondary" href="/request">Нужен список материалов? Заявка на закупку →</Link></p><ol><li><span>01</span>Вы описываете задачу</li><li><span>02</span>Мы собираем предложения</li><li><span>03</span>Менеджер сообщает результат</li></ol></section><section className="auth-card"><ProductRequestForm productName={product ?? ""} contactName={customer?.fullName ?? ""} contactPhone={user.phone ?? ""} contactEmail={user.email ?? ""} authenticated /></section></div></main><SiteFooter /></>;
}

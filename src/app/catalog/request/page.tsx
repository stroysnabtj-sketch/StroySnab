import { eq } from "drizzle-orm";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductRequestForm } from "@/components/product-request-form";
import { getDb } from "@/db";
import { customers } from "@/db/schema";
import { optionalUser } from "@/modules/auth/session";
export const metadata = { title: "Заявка на отсутствующий товар", description: "Не нашли строительный материал? Оставьте заявку — менеджер проверит предложения поставщиков." };
export default async function ProductRequestPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const [{ product }, user] = await Promise.all([searchParams, optionalUser()]); let fullName = ""; let email = "";
  if (user) { const db = await getDb(); const [customer] = await db.select().from(customers).where(eq(customers.userId, user.id)).limit(1); fullName = customer?.fullName ?? ""; email = user.email ?? ""; }
  return <><SiteHeader /><main className="shell"><div className="request-layout"><section className="request-intro"><span className="eyebrow">Индивидуальная закупка</span><h1>Не нашли нужный материал?</h1><p>Опишите товар и количество. Мы передадим запрос активным поставщикам и вернёмся с ценой и сроком поставки.</p><ol><li><span>01</span>Вы описываете задачу</li><li><span>02</span>Мы собираем предложения</li><li><span>03</span>Менеджер сообщает результат</li></ol></section><section className="auth-card"><ProductRequestForm productName={product ?? ""} contactName={fullName} contactPhone={user?.phone ?? ""} contactEmail={email} authenticated={user?.role === "CUSTOMER"} /></section></div></main><SiteFooter /></>;
}

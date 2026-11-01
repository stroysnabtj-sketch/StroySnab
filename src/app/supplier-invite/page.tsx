import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { InvitationForm } from "@/components/invitation-form";
export const metadata = { title: "Приглашение в команду поставщика" };
export default async function SupplierInvitePage({ searchParams }: { searchParams: Promise<{ code?: string }> }) { const { code = "" } = await searchParams; return <><SiteHeader /><main className="shell"><div className="auth-layout"><section className="auth-intro"><span className="eyebrow">STROYHUB.TJ · Поставщик</span><h1>Присоединяйтесь к команде</h1><p>Создайте личный аккаунт сотрудника. Компания увидит ваши действия в кабинете, а права будут ограничены её данными.</p></section><section className="auth-card">{code ? <InvitationForm code={code} /> : <div className="form-alert">Ссылка приглашения не содержит код.</div>}</section></div></main><SiteFooter /></>; }

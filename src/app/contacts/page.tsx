import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getTranslator } from "@/i18n/server";

export const metadata = { title: "Контакты — Stroysnab.tj" };

export default async function ContactsPage() {
  const tr = await getTranslator();
  return (
    <>
      <SiteHeader />
      <main className="shell">
        <header className="page-head">
          <span className="eyebrow">Stroysnab.tj</span>
          <h1>{tr("Контакты")}</h1>
          <p>{tr("Душанбе · Пн–Сб, 08:00–18:00")}</p>
        </header>
        <section className="content-section prose">
          <h2>{tr("Отдел продаж и диспетчерская")}</h2>
          <p>
            <a className="text-link" href="tel:+992446000000">
              +992 44 600 00 00
            </a>
          </p>
          <p>
            <a className="text-link" href="mailto:salom@stroysnab.tj">
              salom@stroysnab.tj
            </a>
          </p>
          <p>{tr("Приём заявок и расчёт коммерческих предложений на платформе работает круглосуточно.")}</p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

import { publicContacts } from "@/modules/system/public-contacts";
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
            <a className="text-link" href={publicContacts.phoneHref}>
              {publicContacts.phone}
            </a>
          </p>
          <p>
            <a className="text-link" href={`mailto:${publicContacts.officeEmail}`}>
              {publicContacts.officeEmail}
            </a>
          </p>
          <p>
            {tr("Поддержка")}{" "}
            <a className="text-link" href={`mailto:${publicContacts.supportEmail}`}>
              {publicContacts.supportEmail}
            </a>
          </p>
          <p>{tr(publicContacts.address)}</p>
          <p>{tr("Приём заявок и расчёт коммерческих предложений на платформе работает круглосуточно.")}</p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

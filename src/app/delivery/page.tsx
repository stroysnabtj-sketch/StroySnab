import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getTranslator } from "@/i18n/server";

export const metadata = { title: "Доставка и оплата — Stroysnab.tj" };

export default async function DeliveryPage() {
  const tr = await getTranslator();
  return (
    <>
      <SiteHeader />
      <main className="shell">
        <header className="page-head">
          <span className="eyebrow">{tr("По Таджикистану")}</span>
          <h1>{tr("Доставка и оплата")}</h1>
          <p>
            {tr(
              "Стоимость доставки рассчитывает менеджер после оформления заказа. Машину подбирает диспетчер с учётом веса, объёма и длины груза.",
            )}
          </p>
        </header>
        <section className="content-section prose">
          <h2>{tr("Оплата")}</h2>
          <p>
            {tr("Доступны оплата при получении и по счёту по согласованию с менеджером. Цена фиксируется после подтверждения заказа.")}
          </p>
          <h2>{tr("Доставка")}</h2>
          <p>{tr("Окно прибытия согласуется с покупателем. Статус доставки отображается в кабинете.")}</p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getTranslator } from "@/i18n/server";
import { t } from "@/i18n";

export const metadata: Metadata = {
  title: "Пользовательское соглашение | Stroysnab.tj",
  description: "Условия использования платформы STROYSNAB.TJ",
};

export default async function TermsPage() {
  const tr = await getTranslator();
  const sections = Array.from({ length: 8 }, (_, index) => index + 1);
  return (
    <>
      <SiteHeader />
      <main className="shell">
        <header className="page-head">
          <span className="eyebrow">STROYSNAB.TJ · 2026-11-16</span>
          <h1>{tr(t("terms.title"))}</h1>
          <p>{tr(t("terms.updated"))}</p>
        </header>
        <div className="content-section">
          <nav className="toc" aria-label={tr(t("terms.toc"))}>
            <strong>{tr(t("terms.toc"))}</strong>
            <ol>
              {sections.map((id) => (
                <li key={id}>
                  <a href={`#s${id}`}>{tr(t(`terms.s${id}.title` as "terms.s1.title"))}</a>
                </li>
              ))}
            </ol>
          </nav>
          <article className="prose">
            {sections.map((id) => (
              <section key={id}>
                <h2 id={`s${id}`}>{tr(t(`terms.s${id}.title` as "terms.s1.title"))}</h2>
                <p>{tr(t(`terms.s${id}.body` as "terms.s1.body"))}</p>
              </section>
            ))}
          </article>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

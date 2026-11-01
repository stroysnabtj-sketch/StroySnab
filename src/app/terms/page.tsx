import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { t } from "@/i18n";
export const metadata: Metadata = { title: "Пользовательское соглашение", description: "Условия использования платформы STROYHUB.TJ" };
export default function TermsPage() {
  const sections = Array.from({ length: 8 }, (_, index) => index + 1);
  return <><SiteHeader /><main className="shell"><header className="page-head"><span className="eyebrow">STROYHUB.TJ · 2026-10-30</span><h1>{t("terms.title")}</h1><p>{t("terms.updated")}</p></header><div className="content-section"><nav className="toc" aria-label={t("terms.toc")}><strong>{t("terms.toc")}</strong><ol>{sections.map((id) => <li key={id}><a href={`#s${id}`}>{t(`terms.s${id}.title` as "terms.s1.title")}</a></li>)}</ol></nav><article className="prose">{sections.map((id) => <section key={id}><h2 id={`s${id}`}>{t(`terms.s${id}.title` as "terms.s1.title")}</h2><p>{t(`terms.s${id}.body` as "terms.s1.body")}</p></section>)}</article></div></main><SiteFooter /></>;
}

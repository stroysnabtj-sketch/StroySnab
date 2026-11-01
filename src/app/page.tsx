import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductArt } from "@/components/product-art";
import { t } from "@/i18n";

const categories = [
  { slug: "cement", name: "Цемент и смеси", count: "01", art: "cement" as const },
  { slug: "metal", name: "Металлопрокат", count: "02", art: "rebar" as const },
  { slug: "masonry", name: "Кирпич и блоки", count: "03", art: "brick" as const },
];

export default function HomePage() {
  return <><SiteHeader /><main>
    <section className="hero shell"><div className="hero-copy"><div className="eyebrow">{t("home.eyebrow")}</div><h1><span>{t("home.titleA")}</span><span className="accent">{t("home.titleB")}</span></h1><p className="hero-lead">{t("home.lead")}</p><div className="hero-actions"><Link href="/catalog" className="button button-primary"><span className="button-label" data-label={t("home.cta")}>{t("home.cta")}<ArrowUpRight size={17} /></span></Link><Link href="/catalog/request" className="text-link">{t("home.request")}</Link></div><div className="hero-stats"><div className="hero-stat"><strong>200+</strong><span>{t("home.statProducts")}</span></div><div className="hero-stat"><strong>3</strong><span>{t("home.statSuppliers")}</span></div><div className="hero-stat"><strong>01</strong><span>{t("home.statWindow")}</span></div></div></div><div className="hero-visual" aria-label="Примеры строительных материалов"><article className="material-card"><div className="material-card-art"><ProductArt variant="cement" /></div><div className="material-card-meta"><span>М500 · 50 КГ</span><strong>Цемент портландский</strong></div></article><article className="material-card"><div className="material-card-art"><ProductArt variant="rebar" /></div><div className="material-card-meta"><span>А500С · Ø12 ММ</span><strong>Арматура стальная</strong></div></article><article className="material-card"><div className="material-card-art"><ProductArt variant="brick" /></div><div className="material-card-meta"><span>М150 · РЯДОВОЙ</span><strong>Кирпич керамический</strong></div></article></div></section>
    <section className="home-section shell"><div className="section-head"><h2 className="section-title">{t("home.categories")}</h2><Link href="/catalog" className="text-link">Все категории <ArrowUpRight size={16} /></Link></div><div className="category-grid">{categories.map((category) => <Link href={`/catalog?category=${category.slug}`} className="category-tile" key={category.slug}><span className="mono">{category.count}</span><div className="category-tile-art"><ProductArt variant={category.art} /></div><h3>{category.name}</h3></Link>)}</div></section>
    <section className="home-section shell"><div className="section-head"><h2 className="section-title">{t("home.how")}</h2></div><div className="process-grid">{[1,2,3].map((step) => <div className="process-step" key={step}><span className="mono">0{step}</span><h3>{t(`home.step${step}` as "home.step1")}</h3><p>{t(`home.step${step}Text` as "home.step1Text")}</p></div>)}</div></section>
  </main><SiteFooter /></>;
}

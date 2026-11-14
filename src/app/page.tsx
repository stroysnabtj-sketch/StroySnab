import { getTranslator } from "@/i18n/server";
import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { unstable_cache } from "next/cache";
import { connection } from "next/server";
import { ArrowRight, Package, Truck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CategoryTile } from "@/components/category-tile";
import { ProductCard } from "@/components/product-card";
import { ProductReveal, CategoryReveal } from "@/components/reveal";
import { listCatalog, listCategories } from "@/modules/catalog/service";
import { getHomeCollections } from "@/modules/merchandising/service";
import { getHomeContent } from "@/modules/merchandising/home-content-service";
import { HomeCardGrid } from "@/components/home-card-grid";
import { HomeAdvertising } from "@/components/home-advertising";

import { CATEGORIES_TREE } from "@/modules/catalog/categories-data";
import "./home-mobile.css";
import "./home-hero.css";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const getHomeCatalog = unstable_cache(
  () =>
    Promise.all([
      listCatalog({ inStock: true, pageSize: 8, diverse: true }),
      listCategories(),
      getHomeCollections(),
      getHomeContent(),
    ]),
  ["storefront-home-v1"],
  { revalidate: 30 },
);

export default async function HomePage() {
  await connection();
  const tr = await getTranslator();
  const [catalog, categories, collections, content] = await getHomeCatalog();
  const roots = categories.filter((category) => !category.parentId && category.isActive === "true");
  const canonicalRoots = CATEGORIES_TREE.map((node) =>
    roots.find((category) => category.slug === node.slug),
  ).filter((row): row is (typeof roots)[number] => Boolean(row));
  const featuredRoots = canonicalRoots.length === CATEGORIES_TREE.length ? canonicalRoots : roots;
  return (
    <>
      <SiteHeader className="home-site-header" />
      <main className="storefront-home">
        <section className="shell home-hero-wrap">
          <div className="store-hero">
            <div className="store-hero-copy">
              <h1>
                {tr(content.hero.title)
                  .split("\n")
                  .map((line, index) => (
                    <span key={index}>{line}</span>
                  ))}
              </h1>
              <p>{tr(content.hero.subtitle)}</p>
              <div className="hero-banner-actions">
                <Link
                  href={content.hero.primaryHref}
                  className="button button-primary hero-shop-button"
                  aria-label={tr(content.hero.primaryLabel)}
                >
                  <span className="button-label" data-label={tr(content.hero.primaryLabel)}>
                    {tr(content.hero.primaryLabel)}
                  </span>
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href={content.hero.secondaryHref}
                  className="button hero-quote-button"
                  aria-label={tr(content.hero.secondaryLabel)}
                >
                  <span className="button-label" data-label={tr(content.hero.secondaryLabel)}>
                    {tr(content.hero.secondaryLabel)}
                  </span>
                </Link>
              </div>
            </div>
            <div className="store-hero-scene hero-photo-scene">
              <picture>
                {content.hero.mobileImage && (
                  <source media="(max-width: 600px)" srcSet={content.hero.mobileImage} />
                )}
                <Image
                  src={content.hero.image}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1440px) 100vw, 1400px"
                  className="hero-editorial-photo"
                />
              </picture>
            </div>
          </div>
        </section>
        <section className="shell home-categories-section">
          <div className="section-head">
            <h2>{tr("Каталог")}</h2>
            <Link href="/catalog" className="section-more">
              {tr("Все разделы")} <ArrowRight size={17} />
            </Link>
          </div>
          <HomeCardGrid className="home-categories-grid">
            {featuredRoots.slice(0, 12).map((category, index) => (
              <CategoryReveal key={category.id} index={index} columns={4}>
                <CategoryTile
                  slug={category.slug}
                  name={category.nameRu}
                  childCount={categories.filter((child) => child.parentId === category.id).length}
                />
              </CategoryReveal>
            ))}
          </HomeCardGrid>
        </section>
        <HomeAdvertising ads={content.ads} />
        {(["sale", "new"] as const).map(
          (kind) =>
            collections[kind].length > 0 && (
              <section
                className="shell home-products-section"
                key={kind}
                aria-labelledby={`home-${kind}-title`}
              >
                <div className="section-head">
                  <h2 id={`home-${kind}-title`}>{kind === "new" ? tr("Новинки") : tr("Акции")}</h2>
                  <Link href="/catalog" className="section-more">
                    {tr("В каталог")} <ArrowRight size={17} />
                  </Link>
                </div>
                <HomeCardGrid className="product-grid product-grid-4">
                  {collections[kind].map((product, index) => (
                    <ProductReveal key={product.id} index={index} columns={4}>
                      <ProductCard product={product} />
                    </ProductReveal>
                  ))}
                </HomeCardGrid>
              </section>
            ),
        )}
        {catalog.items.length > 0 && (
          <section className="shell home-products-section">
            <div className="section-head">
              <div>
                <h2>{tr("В наличии")}</h2>
              </div>
              <Link href="/catalog?inStock=1" className="section-more">
                {tr("Все товары")} <ArrowRight size={17} />
              </Link>
            </div>
            <HomeCardGrid className="product-grid product-grid-4">
              {catalog.items.map((product, index) => (
                <ProductReveal key={product.id} index={index} columns={4}>
                  <ProductCard product={product} />
                </ProductReveal>
              ))}
            </HomeCardGrid>
          </section>
        )}
        <section className="shell home-service-section">
          <div className="service-note">
            <Truck size={27} />
            <div>
              <h3>{tr("Доставка на объект")}</h3>
              <p>{tr("Адрес и способ получения — при оформлении заказа.")}</p>
            </div>
            <Link href="/delivery" aria-label="Условия доставки">
              <ArrowRight size={19} />
            </Link>
          </div>
          <div className="service-note">
            <Package size={27} />
            <div>
              <h3>{tr("Строительные материалы")}</h3>
              <p>{tr("Материалы для строительства и ремонта.")}</p>
            </div>
            <Link href="/catalog" aria-label="Открыть каталог">
              <ArrowRight size={19} />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

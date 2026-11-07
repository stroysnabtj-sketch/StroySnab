import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ClipboardList, Package, Truck, ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CategoryTile } from "@/components/category-tile";
import { ProductCard } from "@/components/product-card";
import { ProductReveal, CategoryReveal } from "@/components/reveal";
import { listCatalog, listCategories } from "@/modules/catalog/service";
import { getHomeCollections } from "@/modules/merchandising/service";

import { CATEGORIES_TREE } from "@/modules/catalog/categories-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [catalog, categories, collections] = await Promise.all([
    listCatalog({ inStock: true, pageSize: 8, diverse: true }),
    listCategories(),
    getHomeCollections(),
  ]);
  const roots = categories.filter((category) => !category.parentId && category.isActive === "true");
  const canonicalRoots = CATEGORIES_TREE.map((node) =>
    roots.find((category) => category.slug === node.slug),
  ).filter((row): row is (typeof roots)[number] => Boolean(row));
  const featuredRoots = canonicalRoots.length === CATEGORIES_TREE.length ? canonicalRoots : roots;
  return (
    <>
      <SiteHeader />
      <main className="storefront-home">
        <div className="shell home-intro">
          <span>Строительство и ремонт</span>
          <span>Таджикистан</span>
        </div>
        <section className="shell home-hero-wrap">
          <div
            className="store-hero hero-video-banner"
            style={{
              position: "relative",
              minHeight: "360px",
              borderRadius: "16px",
              overflow: "hidden",
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gridTemplateColumns: "none",
            }}
          >
            <video
              src="/videos/hero-crane.webm"
              autoPlay
              loop
              muted
              playsInline
              poster="/images/editorial/construction-crane-v2.webp"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                zIndex: 1,
              }}
            />
            <div
              style={{
                position: "relative",
                zIndex: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                background: "transparent",
              }}
            >
              <Link
                href="/catalog"
                className="button button-primary hero-shop-button"
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  padding: "14px 28px",
                  borderRadius: "10px",
                  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
                }}
              >
                <span className="button-label" data-label="Выбрать материалы">
                  Выбрать материалы
                </span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
          <Link href="/request" className="home-request-card">
            <div className="request-photo">
              <Image
                src="/images/editorial/workshop-yellow-v1.webp"
                alt="Замер деревянной доски на рабочем столе"
                fill
                sizes="(max-width: 600px) 360px, (max-width: 900px) 320px, 280px"
                className="request-editorial-photo"
              />
              <span className="request-icon">
                <ClipboardList size={24} />
              </span>
            </div>
            <div className="request-copy">
              <span className="small-label">Закупка по списку</span>
              <h2>Рассчитаем ваш список</h2>
              <p>Добавьте материалы или приложите файл. Получите коммерческое предложение.</p>
            </div>
            <span className="request-card-link">
              Оставить заявку <ArrowRight size={18} />
            </span>
          </Link>
        </section>
        <section className="shell home-categories-section">
          <div className="section-head">
            <h2>Каталог</h2>
            <Link href="/catalog" className="section-more">
              Все разделы <ArrowRight size={17} />
            </Link>
          </div>
          <div className="home-categories-grid">
            {featuredRoots.slice(0, 12).map((category, index) => (
              <CategoryReveal key={category.id} index={index} columns={4}>
                <CategoryTile
                  slug={category.slug}
                  name={category.nameRu}
                  childCount={categories.filter((child) => child.parentId === category.id).length}
                />
              </CategoryReveal>
            ))}
          </div>
        </section>
        {(["sale", "new"] as const).map(
          (kind) =>
            collections[kind].length > 0 && (
              <section
                className="shell home-products-section"
                key={kind}
                aria-labelledby={`home-${kind}-title`}
              >
                <div className="section-head">
                  <h2 id={`home-${kind}-title`}>{kind === "new" ? "Новинки" : "Акции"}</h2>
                  <Link href="/catalog" className="section-more">
                    В каталог <ArrowRight size={17} />
                  </Link>
                </div>
                <div className="product-grid product-grid-4">
                  {collections[kind].map((product, index) => (
                    <ProductReveal key={product.id} index={index} columns={4}>
                      <ProductCard product={product} />
                    </ProductReveal>
                  ))}
                </div>
              </section>
            ),
        )}
        {catalog.items.length > 0 && (
          <section className="shell home-products-section">
            <div className="section-head">
              <div>
                <span className="small-label">Можно заказать сейчас</span>
                <h2>В наличии</h2>
              </div>
              <Link href="/catalog?inStock=1" className="section-more">
                Все товары <ArrowRight size={17} />
              </Link>
            </div>
            <div className="product-grid product-grid-4">
              {catalog.items.map((product, index) => (
                <ProductReveal key={product.id} index={index} columns={4}>
                  <ProductCard product={product} />
                </ProductReveal>
              ))}
            </div>
          </section>
        )}
        <section className="shell home-service-section">
          <div className="service-note">
            <Truck size={27} />
            <div>
              <h3>Доставка на объект</h3>
              <p>Адрес и способ получения — при оформлении заказа.</p>
            </div>
            <Link href="/delivery" aria-label="Условия доставки">
              <ArrowRight size={19} />
            </Link>
          </div>
          <div className="service-note">
            <Package size={27} />
            <div>
              <h3>Предложения магазинов</h3>
              <p>Выбирайте по цене, остатку и сроку поставки.</p>
            </div>
            <Link href="/catalog" aria-label="Посмотреть предложения">
              <ArrowRight size={19} />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

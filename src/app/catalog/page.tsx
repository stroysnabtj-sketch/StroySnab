import { getTranslator } from "@/i18n/server";
import { CategoryTile } from "@/components/category-tile";
import { CATEGORIES_TREE } from "@/modules/catalog/categories-data";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LEGACY_CATEGORY_REDIRECTS } from "@/modules/catalog/legacy-taxonomy";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { ProductReveal, CategoryReveal } from "@/components/reveal";
import { CatalogPageSize } from "@/components/catalog-page-size";
import { catalogPageSize, parseCatalogAttributeRanges } from "@/modules/catalog/types";
import { CatalogFiltersPanel } from "@/components/catalog-filters-panel";
import { CatalogSortSelect } from "@/components/catalog-sort-select";
import { ActiveFilterChips } from "@/components/active-filter-chips";
import { EmptyState } from "@/components/ui";
import { listCatalog, listCategories } from "@/modules/catalog/service";
import { toDirams } from "@/modules/system/money";
export const metadata: Metadata = {
  title: "Каталог строительных материалов | Stroysnab.tj",
  description: "Строительные материалы: цены, характеристики и наличие.",
  alternates: { canonical: "/catalog" },
};
type Params = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
export default async function CatalogPage({ searchParams }: { searchParams: Promise<Params> }) {
  const tr = await getTranslator();
  const params = await searchParams;
  const categorySlug = one(params.category);
  const categories = await listCategories();
  const current = categories.find((c) => c.slug === categorySlug);
  const replacement = categorySlug ? LEGACY_CATEGORY_REDIRECTS[categorySlug] : undefined;
  if (!current && replacement && categories.some((category) => category.slug === replacement)) {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params))
      for (const item of Array.isArray(value) ? value : value ? [value] : [])
        next.append(key, item);
    next.set("category", replacement);
    redirect(`/catalog?${next}`);
  }
  const ancestors: typeof categories = [];
  let parent = current?.parentId;
  const visited = new Set<string>();
  while (parent && !visited.has(parent)) {
    visited.add(parent);
    const item = categories.find((c) => c.id === parent);
    if (!item) break;
    ancestors.unshift(item);
    parent = item.parentId;
  }
  const known = new Set([
    "q",
    "category",
    "brand",
    "minPrice",
    "maxPrice",
    "inStock",
    "sort",
    "page",
    "pageSize",
    "attributeName",
    "attributeValue",
  ]);
  const attributeRanges = parseCatalogAttributeRanges(params);
  const attributes = Object.fromEntries(
    Object.entries(params).filter(
      ([key, value]) => !known.has(key) && !/^range(Min|Max)\./.test(key) && value,
    ),
  ) as Record<string, string | string[]>;
  const price = (value: string | string[] | undefined) => {
    try {
      const text = one(value);
      return text ? toDirams(text).toString() : undefined;
    } catch {
      return undefined;
    }
  };
  const query = {
    q: one(params.q)?.trim(),
    category: categorySlug,
    brands: typeof params.brand === "string" ? [params.brand] : params.brand,
    minPrice: price(params.minPrice),
    maxPrice: price(params.maxPrice),
    inStock: one(params.inStock) === "1",
    attributes,
    attributeRanges,
    attributeName:
      one(params.attributeName) ?? (one(params.attributeValue) ? "Назначение" : undefined),
    attributeValue: one(params.attributeValue),
    sort: one(params.sort) ?? "name",
    page: Number(one(params.page) ?? 1),
    pageSize: catalogPageSize(one(params.pageSize)),
  };
  const breadcrumb = (
    <nav className="breadcrumbs" aria-label="Хлебные крошки">
      <Link href="/">{tr("Главная")}</Link>
      <span>/</span>
      <Link href="/catalog">Каталог</Link>
      {ancestors.map((c) => (
        <span key={c.id}>
          {" "}
          / <Link href={`/catalog?category=${encodeURIComponent(c.slug)}`}>{c.nameRu}</Link>
        </span>
      ))}
      {current && <span aria-current="page"> / {current.nameRu}</span>}
    </nav>
  );
  const roots = categories.filter((category) => !category.parentId);
  const referenceRoots = CATEGORIES_TREE.map((root) =>
    roots.find((category) => category.slug === root.slug),
  ).filter((row): row is (typeof categories)[number] => Boolean(row));
  const children = current
    ? categories.filter((category) => category.parentId === current.id)
    : referenceRoots.length === CATEGORIES_TREE.length
      ? referenceRoots
      : roots;
  const explicitResults = Boolean(
    query.q ||
    query.brands?.length ||
    query.inStock ||
    query.minPrice ||
    query.maxPrice ||
    Object.keys(attributes).length ||
    Object.keys(attributeRanges).length,
  );
  if (children.length && !explicitResults)
    return (
      <>
        <SiteHeader />
        <main className="shell catalog-browse-page">
          {breadcrumb}
          <h1 className="sr-only">{current?.nameRu ?? "Каталог"}</h1>
          <section className="catalog-category-grid" aria-label="Категории каталога">
            {children.map((category, index) => (
              <CategoryReveal key={category.id} index={index} columns={4}>
                <CategoryTile
                  slug={category.slug}
                  name={category.nameRu}
                  childCount={categories.filter((child) => child.parentId === category.id).length}
                />
              </CategoryReveal>
            ))}
          </section>
          {!current &&
            referenceRoots.length === CATEGORIES_TREE.length &&
            roots.some((root) => !referenceRoots.includes(root)) && (
              <details className="catalog-other-categories">
                <summary>Другие разделы</summary>
                <div>
                  {roots
                    .filter((root) => !referenceRoots.includes(root))
                    .map((root) => (
                      <Link key={root.id} href={`/catalog?category=${root.slug}`}>
                        {root.nameRu}
                      </Link>
                    ))}
                </div>
              </details>
            )}
        </main>
        <SiteFooter />
      </>
    );
  const result = await listCatalog(query);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const pageUrl = (page: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params))
      for (const item of Array.isArray(value) ? value : value ? [value] : [])
        next.append(key, item);
    next.set("page", String(page));
    return `/catalog?${next}`;
  };
  return (
    <>
      <SiteHeader />
      <main className="shell catalog-main-shell catalog-products-page">
        {breadcrumb}
        <div className="catalog-layout">
          <aside className="catalog-sidebar">
            <CatalogFiltersPanel
              key={categorySlug ?? "all"}
              currentCategory={categorySlug}
              allBrands={result.brands}
              brandFacets={result.brandFacets}
              facets={result.facets}
              totalProducts={result.total}
            />
          </aside>
          <section className="catalog-results" aria-live="polite">
            <div className="catalog-toolbar">
              <h1 className="toolbar-title">Товары</h1>
              <span className="catalog-price-caption">{tr("Цены в сомони")}</span>
              <CatalogSortSelect currentSort={query.sort} currentCategory={categorySlug} />
            </div>
            <ActiveFilterChips
              currentCategory={categorySlug}
              facetLabels={Object.fromEntries(
                result.facets.map((field) => [field.key, { label: field.label, unit: field.unit }]),
              )}
            />
            {result.items.length ? (
              <div className="product-grid catalog-products-grid">
                {result.items.map((product, index) => (
                  <ProductReveal key={product.id} index={index}>
                    <ProductCard product={product} />
                  </ProductReveal>
                ))}
              </div>
            ) : (
              <EmptyState
                title={tr("Товары не найдены")}
                text="Измените фильтры или отправьте запрос на нужный материал."
                action={
                  <div className="empty-actions">
                    <Link
                      className="button button-secondary"
                      href={
                        categorySlug
                          ? `/catalog?category=${encodeURIComponent(categorySlug)}`
                          : "/catalog"
                      }
                    >
                      <span className="button-label" data-label={tr("Сбросить фильтры")}>
                        {tr("Сбросить фильтры")}
                      </span>
                    </Link>
                    <Link
                      className="button button-primary"
                      href={`/catalog/request${query.q ? `?product=${encodeURIComponent(query.q)}` : ""}`}
                    >
                      <span className="button-label" data-label={tr("Запросить товар")}>
                        {tr("Запросить товар")}
                      </span>
                    </Link>
                  </div>
                }
              />
            )}
            <div className="pagination catalog-pagination-controls">
              <CatalogPageSize currentSize={result.pageSize} />
              {totalPages > 1 && (
                <nav className="pagination" aria-label="Страницы каталога">
                  {result.page > 1 && (
                    <Link className="button button-secondary" href={pageUrl(result.page - 1)}>
                      <span className="button-label" data-label="Назад">
                        Назад
                      </span>
                    </Link>
                  )}
                  <span>
                    Страница {result.page} из {totalPages}
                  </span>
                  {result.page < totalPages && (
                    <Link className="button button-secondary" href={pageUrl(result.page + 1)}>
                      <span className="button-label" data-label="Далее">
                        Далее
                      </span>
                    </Link>
                  )}
                </nav>
              )}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

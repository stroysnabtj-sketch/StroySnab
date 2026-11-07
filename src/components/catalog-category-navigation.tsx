import Link from "next/link";
import { CATEGORIES_TREE, REFERENCE_CATEGORY_SLUGS } from "@/modules/catalog/categories-data";
type Category = { id: string; parentId: string | null; slug: string; nameRu: string };
export function CatalogCategoryNavigation({
  categories,
  currentSlug,
}: {
  categories: Category[];
  currentSlug?: string;
}) {
  const current = categories.find((c) => c.slug === currentSlug);
  const roots = categories.filter((c) => !c.parentId);
  const hasReference = CATEGORIES_TREE.every((root) => roots.some((c) => c.slug === root.slug));
  const primary = roots.filter((c) => !hasReference || REFERENCE_CATEGORY_SLUGS.has(c.slug));
  const legacy = roots.filter((c) => hasReference && !REFERENCE_CATEGORY_SLUGS.has(c.slug));
  const children = categories.filter((c) => c.parentId === current?.id);
  const href = (category: Category) => `/catalog?category=${encodeURIComponent(category.slug)}`;
  function node(category: Category, seen: string[] = []): React.ReactNode {
    if (seen.includes(category.id)) return null;
    const nested = categories.filter((c) => c.parentId === category.id);
    return nested.length ? (
      <details key={category.id}>
        <summary>{category.nameRu}</summary>
        <Link href={href(category)}>Все товары раздела</Link>
        <div>{nested.map((child) => node(child, [...seen, category.id]))}</div>
      </details>
    ) : (
      <Link key={category.id} href={href(category)}>
        {category.nameRu}
      </Link>
    );
  }
  return (
    <section className="compact-categories" aria-label="Категории">
      <div className="compact-categories-top">
        <details className="catalog-tree-picker">
          <summary>Все разделы каталога</summary>
          <nav aria-label="Дерево каталога">
            {primary.map((c) => node(c))}
            {legacy.length > 0 && (
              <details>
                <summary>Прежние разделы</summary>
                {legacy.map((c) => node(c))}
              </details>
            )}
          </nav>
        </details>
        <span>{current?.nameRu ?? "Все материалы"}</span>
      </div>
      <nav
        className="compact-category-links"
        aria-label={current ? "Подкатегории" : "Основные разделы"}
      >
        {(current ? children : primary).map((category) => (
          <Link key={category.id} href={href(category)}>
            {category.nameRu}
          </Link>
        ))}
      </nav>
    </section>
  );
}

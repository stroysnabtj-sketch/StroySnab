import Link from "next/link";
import { listCategories } from "@/modules/catalog/service";
export async function CategoryNavChips({currentCategorySlug}: {currentCategorySlug?: string; totalItems?: number}) {
  const categories = await listCategories();
  const current = categories.find(category => category.slug === currentCategorySlug);
  const ancestry = new Set<string>();
  let item = current;
  while (item && !ancestry.has(item.id)) { ancestry.add(item.id); item = categories.find(category => category.id === item?.parentId); }
  const roots = categories.filter(category => !category.parentId);
  const children = current ? categories.filter(category => category.parentId === current.id) : [];
  return <div className="catalog-category-nav"><nav className="top-categories-bar" aria-label="Разделы каталога"><Link className={`top-cat-pill ${!current ? "is-active" : ""}`} href="/catalog">Все категории</Link>{roots.map(category => <Link className={`top-cat-pill ${ancestry.has(category.id) ? "is-active" : ""}`} key={category.id} href={`/catalog?category=${encodeURIComponent(category.slug)}`}>{category.nameRu}</Link>)}</nav>{children.length > 0 && <nav className="subcategories-bar" aria-label="Подкатегории">{children.map(category => <Link className="sub-cat-chip" key={category.id} href={`/catalog?category=${encodeURIComponent(category.slug)}`}>{category.nameRu}</Link>)}</nav>}</div>;
}

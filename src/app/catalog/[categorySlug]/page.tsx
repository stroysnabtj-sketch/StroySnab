import { listCategories } from "@/modules/catalog/service";
import CatalogPage from "../page";
export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params; const categories = await listCategories(); const category = categories.find((item) => item.slug === categorySlug);
  return { title: category?.nameRu ?? "Категория", description: category ? `${category.nameRu} с доставкой по Таджикистану — STROYHUB.TJ` : undefined, alternates: { canonical: `/catalog/${categorySlug}` } };
}
export default async function CategoryPage({ params, searchParams }: { params: Promise<{ categorySlug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { categorySlug } = await params; const original = await searchParams; const merged = new Promise<Record<string, string | string[] | undefined>>((resolve) => resolve({ ...original, category: categorySlug }));
  return CatalogPage({ searchParams: merged });
}

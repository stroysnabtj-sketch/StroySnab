import type { Metadata } from "next";
import CatalogPage from "../page";
import { listCategories } from "@/modules/catalog/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = (await listCategories()).find((item) => item.slug === categorySlug);
  const title = category?.nameRu ?? "Каталог строительных материалов";

  return {
    title: `${title} — материалы и цены | Stroysnab.tj`,
    description: `Товары в категории «${title}». Цены в сомони, характеристики и предложения магазинов.`,
    alternates: { canonical: `/catalog/${categorySlug}` },
  };
}

export default async function CategoryCatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ categorySlug }, rawSearchParams] = await Promise.all([params, searchParams]);

  // Объединяем params.categorySlug в searchParams
  const mergedSearchParams = Promise.resolve({
    ...rawSearchParams,
    category: categorySlug,
  });

  return <CatalogPage searchParams={mergedSearchParams} />;
}

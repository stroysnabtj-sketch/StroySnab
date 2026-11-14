import { headers } from "next/headers";
import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductDetailView } from "@/components/product-detail-view";
import { getPublicProduct } from "@/modules/catalog/service";

const loadProduct = cache((slug: string) => getPublicProduct(slug));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await loadProduct(slug);
  if (!item) return { title: "Товар не найден | Stroysnab.tj" };

  return {
    title: `${item.product.nameRu} — купить в Душанбе | Stroysnab.tj`,
    description:
      item.product.descriptionRu ??
      `Купить ${item.product.nameRu} с доставкой по Таджикистану по лучшей цене в магазине Stroysnab.tj.`,
    alternates: { canonical: `/product/${slug}` },
    openGraph: {
      title: item.product.nameRu,
      description: item.product.descriptionRu ?? undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await loadProduct(slug);
  if (!item) notFound();

  const best = item.offers[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.product.nameRu,
    sku: item.product.sku,
    brand: item.product.brand ? { "@type": "Brand", name: item.product.brand } : undefined,
    description: item.product.descriptionRu,
    offers: {
      "@type": "Offer",
      seller: { "@type": "Organization", name: "StroySnab", url: "https://www.stroysnab.tj" },
      priceCurrency: "TJS",
      price: best ? (Number(best.priceDirams) / 100).toFixed(2) : "0.00",
      availability:
        best && Number(best.stockQty) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <SiteHeader />
      <main className="shell product-page-shell">
        <ProductDetailView
          product={item.product}
          category={item.category}
          attributes={item.attributes}
          images={item.images}
          offers={item.offers}
          relatedProducts={item.relatedProducts ?? []}
        />
        <script
          nonce={(await headers()).get("x-nonce") ?? undefined}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </main>
      <SiteFooter />
    </>
  );
}

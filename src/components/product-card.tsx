import Link from "next/link";
import Image from "next/image";
import { ProductArt, getArtVariant } from "@/components/product-art";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { formatTJS } from "@/modules/system/money";
import type { PublicProduct } from "@/modules/catalog/types";
export function ProductCard({ product }: { product: PublicProduct }) {
  const inStock = Number(product.stockQty) >= Number(product.minOrderQty);
  const image =
    (product as PublicProduct & { imageUrl?: string | null }).imageUrl || product.imageKey;
  return (
    <article className="product-card">
      <Link
        href={`/product/${product.slug}`}
        className="product-card-image"
        aria-label={product.name}
      >
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 600px) 50vw, (max-width: 1000px) 33vw, 25vw"
          />
        ) : (
          <ProductArt
            variant={getArtVariant(product.categorySlug, product.name)}
            className="product-art-svg"
          />
        )}
      </Link>
      <div className="product-card-body">
        <div className="product-card-brand-row">
          {product.brand ? (
            <Link
              href={`/catalog?brand=${encodeURIComponent(product.brand)}`}
              className="product-card-brand"
            >
              {product.brand}
            </Link>
          ) : (
            <span className="product-card-brand">{product.categoryName}</span>
          )}
        </div>
        <Link href={`/product/${product.slug}`} className="product-card-title-link">
          <h3 className="product-card-title">{product.name}</h3>
        </Link>
        <div className="price-container">
          <div className="product-card-price-row">
            <strong className="product-card-price">{formatTJS(product.priceDirams)}</strong>
            <span className="product-card-unit">/ {product.unit}</span>
          </div>
        </div>
        <div className="product-card-status" data-stock={inStock}>
          <span className="status-indicator" />
          <span>{inStock ? "В наличии" : "Под заказ"}</span>
        </div>
        <div className="product-card-action-bar">
          {inStock ? (
            <AddToCartButton offerId={product.offerId} minOrderQty={product.minOrderQty} />
          ) : (
            <Link
              href={`/catalog/request?product=${encodeURIComponent(product.name)}`}
              className="button button-secondary"
            >
              <span className="button-label" data-label="Запросить">
                Запросить
              </span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

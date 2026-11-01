import Link from "next/link";
import { ProductArt } from "@/components/product-art";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { formatTJS } from "@/modules/system/money";
import type { PublicProduct } from "@/modules/catalog/types";

function artFor(category: string): "cement" | "rebar" | "brick" | "pipe" {
  if (/metal|rebar|profile/.test(category)) return "rebar";
  if (/masonry|brick|block/.test(category)) return "brick";
  if (/plumb|pipe|fitting/.test(category)) return "pipe";
  return "cement";
}
export function ProductCard({ product }: { product: PublicProduct }) {
  return <article className="product-card">
    <Link href={`/product/${product.slug}`} className="product-card-art"><ProductArt variant={artFor(product.categorySlug)} /><span className="product-card-sku mono">{product.sku}</span></Link>
    <div className="product-card-body"><Link href={`/catalog?category=${product.categorySlug}`} className="product-card-category">{product.categoryName}</Link><Link href={`/product/${product.slug}`}><h3>{product.name}</h3></Link><div className="product-card-stock">{Number(product.stockQty) > 0 ? <span className="badge badge-success">В наличии · {product.stockQty} {product.unit}</span> : <span className="badge badge-warning">Под заказ · {product.leadTimeDays} дн.</span>}{product.offerCount > 1 && <span className="muted">{product.offerCount} предложения</span>}</div><div className="product-card-bottom"><div><strong>{formatTJS(product.priceDirams)}</strong><span> / {product.unit}</span></div><AddToCartButton offerId={product.offerId} disabled={Number(product.stockQty) <= 0} compact /></div></div>
  </article>;
}

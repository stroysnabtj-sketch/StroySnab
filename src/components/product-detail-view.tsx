"use client";
import Link from "next/link";
import Image from "next/image";
import { useRef, useState, type MouseEvent } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Minus,
  Plus,
  ShoppingCart,
  Truck,
  Package,
  FileText,
} from "lucide-react";
import { ProductArt, getArtVariant } from "@/components/product-art";
import { ProductCard } from "@/components/product-card";
import { formatTJS } from "@/modules/system/money";
import type { PublicProduct } from "@/modules/catalog/types";
import { Button } from "@/components/ui";
import { flyToCart } from "./cart-flight";
import styles from "./product-detail.module.css";
interface OfferItem {
  id: string;
  priceDirams: string;
  stockQty: string;
  minOrderQty: string;
  leadTimeDays: number;
}
interface Props {
  product: {
    id: string;
    sku: string;
    slug: string;
    nameRu: string;
    descriptionRu?: string | null;
    brand?: string | null;
    unit: string;
  };
  category: { id: string; slug: string; nameRu: string };
  attributes: { name: string; value: string }[];
  images: { id: string; fileId: string; sort: number }[];
  offers: OfferItem[];
  relatedProducts: PublicProduct[];
}
export function ProductDetailView({
  product,
  category,
  attributes,
  images,
  offers,
  relatedProducts,
}: Props) {
  const [activeTab, setActiveTab] = useState("description");
  const [qty, setQty] = useState(offers[0]?.minOrderQty ?? "1");
  const [activeImage, setActiveImage] = useState(0);
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const offer = offers[0];
  const available = offer ? Number(offer.stockQty) : 0;
  const min = Number(offer?.minOrderQty ?? 1);
  const amount = Number(qty);
  const inStock = available >= min;
  const art = getArtVariant(category.slug, product.nameRu);
  const validAmount = /^\d+(?:\.\d{1,3})?$/.test(qty) && amount >= min && amount <= available;
  const lineTotal =
    offer && validAmount
      ? (BigInt(offer.priceDirams) * BigInt(Math.round(amount * 1000)) + 500n) / 1000n
      : null;
  function changeQuantity(value: string) {
    setQty(value);
    setAdded(false);
    setError("");
  }
  async function add(event: MouseEvent<HTMLButtonElement>) {
    if (!offer || !validAmount || submitting.current) return;
    submitting.current = true;
    const button = event.currentTarget;
    const source =
      button.closest(".product-detail")?.querySelector<HTMLElement>(".product-gallery-main") ??
      button;
    setPending(true);
    setError("");
    setAdded(false);
    try {
      const response = await fetch("/api/public/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId: offer.id, qty }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Не удалось добавить товар");
      setAdded(true);
      flyToCart(source, button);
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Проверьте подключение к интернету");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  return (
    <div className={`product-detail-page ${styles.product}`}>
      <nav className="breadcrumbs" aria-label="Хлебные крошки">
        <Link href="/">Главная</Link>
        <ChevronRight size={13} />
        <Link href="/catalog">Каталог</Link>
        <ChevronRight size={13} />
        <Link href={`/catalog?category=${encodeURIComponent(category.slug)}`}>
          {category.nameRu}
        </Link>
      </nav>
      <article className="product-detail">
        <div className="product-gallery-section">
          <div className="product-gallery-main">
            {images[activeImage] ? (
              <Image
                src={`/api/files/${images[activeImage].fileId}`}
                alt={product.nameRu}
                fill
                sizes="(max-width: 760px) 100vw, 50vw"
                className="product-real-image"
                priority
              />
            ) : (
              <ProductArt variant={art} className="gallery-main-svg" large />
            )}
          </div>
          {images.length > 1 && (
            <div className="product-gallery-thumbs">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  className={`thumb-btn ${activeImage === index ? "is-active" : ""}`}
                  onClick={() => setActiveImage(index)}
                  aria-label={`Фото ${index + 1}`}
                  aria-pressed={activeImage === index}
                >
                  <Image src={`/api/files/${image.fileId}`} alt="" width={64} height={64} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="product-info">
          <div className="product-info-meta">
            <span>Арт. {product.sku}</span>
            {product.brand && (
              <Link href={`/catalog?brand=${encodeURIComponent(product.brand)}`}>
                {product.brand}
              </Link>
            )}
          </div>
          <h1 className="product-info-title">{product.nameRu}</h1>
          <p className="product-reference">{category.nameRu}</p>
          {offer ? (
            <div className="product-buy">
              <div className="product-price">
                <strong>{formatTJS(offer.priceDirams)}</strong>
                <span>/ {product.unit}</span>
              </div>
              <div className="product-stock-line" data-stock={inStock}>
                <span className="status-indicator" />
                {inStock ? `В наличии · ${offer.stockQty} ${product.unit}` : "Нет в наличии"}
              </div>
              {lineTotal !== null && (
                <div className={styles.lineTotal}>
                  <span>
                    За {qty} {product.unit}
                  </span>
                  <strong>{formatTJS(lineTotal)}</strong>
                </div>
              )}
              <div className="product-actions-row" data-in-stock={inStock}>
                <div className="quantity-stepper">
                  <button
                    type="button"
                    aria-label="Уменьшить количество"
                    disabled={amount <= min}
                    onClick={() =>
                      changeQuantity(
                        String(
                          Math.max(
                            min,
                            Math.round(((Number.isFinite(amount) ? amount : min) - 1) * 1000) /
                              1000,
                          ),
                        ),
                      )
                    }
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    aria-label={`Количество, ${product.unit}`}
                    min={min}
                    max={available}
                    step="0.001"
                    value={qty}
                    onChange={(e) => {
                      changeQuantity(e.target.value);
                    }}
                  />
                  <button
                    type="button"
                    aria-label="Увеличить количество"
                    disabled={amount >= available}
                    onClick={() =>
                      changeQuantity(
                        String(
                          Math.min(
                            available,
                            Math.round(((Number.isFinite(amount) ? amount : min) + 1) * 1000) /
                              1000,
                          ),
                        ),
                      )
                    }
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <Button
                  variant="primary"
                  className="buy-btn"
                  onClick={add}
                  loading={pending}
                  disabled={
                    pending || !inStock || !validAmount || amount < min || amount > available
                  }
                >
                  {added ? <Check size={18} /> : <ShoppingCart size={18} />}
                  {pending ? "Добавляем…" : added ? "Добавлено" : "В корзину"}
                </Button>
              </div>
              <Link
                href={`/catalog/request?product=${encodeURIComponent(product.nameRu)}`}
                className={`button button-secondary ${styles.quoteAction}`}
              >
                <FileText size={18} />
                <span className="button-label" data-label="Получить КП">
                  Получить КП
                </span>
              </Link>
              {qty && !validAmount && (
                <p className={styles.quantityHint} role="status">
                  Укажите от {min} до {offer.stockQty} {product.unit}, не более трёх знаков после
                  запятой.
                </p>
              )}
              {min > 1 && (
                <p className="muted">
                  Минимальный заказ — {offer.minOrderQty} {product.unit}
                </p>
              )}
              {error && (
                <p className="form-alert" role="alert">
                  {error}
                </p>
              )}
              {added && (
                <p role="status" className="sr-only">
                  Товар добавлен в корзину
                </p>
              )}
              {added && (
                <Link href="/cart" className="product-cart-link">
                  Перейти в корзину <ArrowRight size={16} />
                </Link>
              )}
              {!inStock && (
                <Link
                  href={`/catalog/request?product=${encodeURIComponent(product.nameRu)}`}
                  className="button button-secondary"
                >
                  Запросить поставку
                </Link>
              )}
              <div className="product-delivery-note">
                <Truck size={19} />
                <div>
                  <strong>Доставка или самовывоз</strong>
                  <span>Условия и стоимость — при оформлении</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <Package size={24} />
              <h2>Нет активных предложений</h2>
              <Link href="/catalog/request" className="button button-primary">
                Оставить заявку
              </Link>
            </div>
          )}
        </div>
      </article>
      <div className={styles.informationCard}>
        <div className={styles.productTabs} role="tablist" aria-label="Информация о товаре">
          {[
            ["description", "Описание"],
            ["characteristics", "Характеристики"],
          ].map(([id, label], index) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-controls={id}
              aria-selected={activeTab === id}
              tabIndex={activeTab === id ? 0 : -1}
              onClick={() => setActiveTab(id)}
              onKeyDown={(event) => {
                if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                event.preventDefault();
                const next =
                  event.key === "Home"
                    ? "description"
                    : event.key === "End"
                      ? "characteristics"
                      : index === 0
                        ? "characteristics"
                        : "description";
                setActiveTab(next);
                document.getElementById(`tab-${next}`)?.focus();
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="product-sections">
          <section
            id="description"
            role="tabpanel"
            aria-labelledby="tab-description"
            hidden={activeTab !== "description"}
            tabIndex={0}
          >
            <h2>Описание</h2>
            <p className="product-full-description">
              {product.descriptionRu || "Описание не добавлено."}
            </p>
            <Link
              href={`/catalog/request?product=${encodeURIComponent(product.nameRu)}`}
              className="section-more"
            >
              Уточнить характеристики <ArrowRight size={16} />
            </Link>
          </section>
          <section
            id="characteristics"
            role="tabpanel"
            aria-labelledby="tab-characteristics"
            hidden={activeTab !== "characteristics"}
            tabIndex={0}
          >
            <h2>Характеристики</h2>
            <dl className="specification-list">
              <div>
                <dt>Артикул</dt>
                <dd>{product.sku}</dd>
              </div>
              <div>
                <dt>Единица измерения</dt>
                <dd>{product.unit}</dd>
              </div>
              {attributes
                .filter(
                  (a) =>
                    ![
                      "Бренд",
                      "Единица",
                      "Единица измерения",
                      "Назначение",
                      "Страна поставки",
                    ].includes(a.name),
                )
                .map((a) => (
                  <div key={a.name}>
                    <dt>{a.name}</dt>
                    <dd>{a.value}</dd>
                  </div>
                ))}
            </dl>
          </section>
        </div>
      </div>
      {relatedProducts.length > 0 && (
        <section className="related-products-section" id="related-products">
          <div className="section-head">
            <h2>Похожие товары</h2>
            <Link href={`/catalog?category=${category.slug}`} className="section-more">
              Все товары <ArrowRight size={16} />
            </Link>
          </div>
          <div className="product-grid product-grid-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

"use client";
import Link from "next/link";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatTJS } from "@/modules/system/money";
type Item = {
  id: string;
  productName: string;
  slug: string;
  sku: string;
  unit: string;
  qty: string;
  minOrderQty: string;
  subtotalDirams: string;
  stockQty: string;
};
export function CartPanel({
  initialItems,
  totalDirams,
}: {
  initialItems: Item[];
  totalDirams: string;
}) {
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const router = useRouter();
  useEffect(() => {
    setDrafts(Object.fromEntries(initialItems.map((i) => [i.id, i.qty])));
  }, [initialItems]);
  async function update(item: Item, value: string) {
    if (pending) return;
    const qty = value.trim().replace(",", ".");
    if (!/^\d+(?:\.\d{1,3})?$/.test(qty)) {
      setError("Укажите количество: не больше трёх знаков после запятой.");
      setDrafts((d) => ({ ...d, [item.id]: item.qty }));
      return;
    }
    if (qty === item.qty) return;
    setPending(item.id);
    setError("");
    try {
      const response = await fetch(`/api/public/cart/items/${item.id}`, {
        method: Number(qty) === 0 ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: Number(qty) === 0 ? undefined : JSON.stringify({ qty }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message ?? "Не удалось изменить количество");
      }
      window.dispatchEvent(new Event("cartUpdated"));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Проверьте подключение к интернету");
      setDrafts((d) => ({ ...d, [item.id]: item.qty }));
    } finally {
      setPending("");
    }
  }
  return (
    <>
      <div className="cart-layout">
        <section className="cart-items">
          {initialItems.map((item) => (
            <article className="cart-item" key={item.id}>
              <div>
                <Link href={`/product/${item.slug}`}>
                  <h3>{item.productName}</h3>
                </Link>
                <span className="mono muted">
                  {item.sku} · {item.unit}
                </span>
              </div>
              <div className="quantity">
                <button
                  type="button"
                  aria-label={`Уменьшить ${item.productName}`}
                  disabled={!!pending || Number(item.qty) <= Number(item.minOrderQty)}
                  onClick={() =>
                    update(
                      item,
                      String(
                        Math.max(
                          Number(item.minOrderQty),
                          Math.round((Number(item.qty) - 1) * 1000) / 1000,
                        ),
                      ),
                    )
                  }
                >
                  <Minus size={15} />
                </button>
                <input
                  aria-label={`Количество ${item.productName}`}
                  value={drafts[item.id] ?? item.qty}
                  onChange={(e) => setDrafts((d) => ({ ...d, [item.id]: e.target.value }))}
                  onBlur={(e) => {
                    if (e.target.value !== item.qty) void update(item, e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  inputMode="decimal"
                  disabled={!!pending}
                />
                <button
                  type="button"
                  aria-label={`Увеличить ${item.productName}`}
                  disabled={!!pending || Number(item.qty) >= Number(item.stockQty)}
                  onClick={() =>
                    update(item, String(Math.round((Number(item.qty) + 1) * 1000) / 1000))
                  }
                >
                  <Plus size={15} />
                </button>
              </div>
              <strong>{formatTJS(item.subtotalDirams)}</strong>
              <button
                type="button"
                className="icon-button"
                aria-label={`Удалить ${item.productName}`}
                disabled={!!pending}
                onClick={() => update(item, "0")}
              >
                <Trash2 size={17} />
              </button>
            </article>
          ))}
        </section>
        <aside className="cart-summary card">
          <h2>Сумма заказа</h2>
          <div>
            <span>Товары</span>
            <strong>{formatTJS(totalDirams)}</strong>
          </div>
          <div>
            <span>Доставка</span>
            <span>Рассчитается при оформлении</span>
          </div>
          <div className="cart-total">
            <span>Итого за товары</span>
            <strong>{formatTJS(totalDirams)}</strong>
          </div>
          <Link className="button button-primary" href="/checkout">
            К оформлению <ArrowRight size={16} />
          </Link>
        </aside>
      </div>
      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

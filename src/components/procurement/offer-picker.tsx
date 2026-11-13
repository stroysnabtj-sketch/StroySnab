"use client";
import { useState } from "react";
import { api, fromDirams, money } from "./shared";
import type { EditableLine } from "./line-editor";
import s from "./procurement.module.css";
type Offer = {
  id: string;
  productName: string;
  unit: string;
  markupPercent: string;
  supplierName: string;
  supplierPriceDirams: string;
  stockQty: string;
  minOrderQty: string;
  leadTimeDays: number;
  isActive: string;
};
export function OfferPicker({
  line,
  onSelect,
  disabled,
}: {
  line: EditableLine;
  onSelect: (line: EditableLine) => void;
  disabled: boolean;
}) {
  const [query, setQuery] = useState(line.name),
    [items, setItems] = useState<Offer[] | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [selected, setSelected] = useState("");
  async function search() {
    setBusy(true);
    setError("");
    try {
      const result = await api<{ items: Offer[] }>(
        "/api/procurement/offers?" + new URLSearchParams({ q: query, page: "1" }),
      );
      setItems(result.items.filter((o) => o.isActive === "true"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <details>
      <summary>
        {line.offerId
          ? `Предложение магазина${selected ? `: ${selected}` : " выбрано"}`
          : "Закупить отдельно · выбрать магазин"}
      </summary>
      <p className={s.hint}>
        Найдите материал, чтобы использовать цену и остаток магазина. Для отдельной закупки укажите
        цену вручную.
      </p>
      <div className={s.filters}>
        <label className={s.field}>
          Поиск материала в магазинах
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={disabled || busy}
            placeholder="Название или артикул"
          />
        </label>
        <button
          className="button button-secondary"
          type="button"
          disabled={disabled || busy || query.trim().length < 2}
          onClick={() => void search()}
        >
          {busy ? "Ищем…" : "Найти предложения"}
        </button>
      </div>
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      {items && (
        <div className={s.stack}>
          {!items.length && (
            <p className={s.hint}>
              Активных предложений не найдено. Измените поиск или закупите материал отдельно.
            </p>
          )}
          {items.map((o) => (
            <button
              key={o.id}
              type="button"
              className={s.offerResult}
              disabled={disabled}
              onClick={() => {
                onSelect({
                  ...line,
                  offerId: o.id,
                  name: o.productName,
                  unit: o.unit,
                  markupPercent: o.markupPercent,
                  price: fromDirams(o.supplierPriceDirams),
                });
                setSelected(o.supplierName);
                setItems(null);
              }}
            >
              <strong>{o.productName}</strong>
              <span>
                {o.supplierName} · {money(o.supplierPriceDirams)} / {o.unit}
              </span>
              <span className={s.hint}>
                В наличии {o.stockQty} {o.unit} · минимум {o.minOrderQty} · срок {o.leadTimeDays}{" "}
                дн.
              </span>
            </button>
          ))}
        </div>
      )}
      {line.offerId && (
        <button
          className="button button-secondary"
          type="button"
          disabled={disabled}
          onClick={() => {
            onSelect({ ...line, offerId: undefined });
            setSelected("");
          }}
        >
          Закупить отдельно
        </button>
      )}
    </details>
  );
}

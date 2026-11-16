"use client";
import { useLocale } from "@/i18n/provider";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

type ReorderItem = {
  offerId: string | null;
  qty: string;
};

export function ReorderButton({ items }: { items: ReorderItem[] }) {
  const { tr } = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const validItems = items.filter((item): item is { offerId: string; qty: string } =>
    Boolean(item.offerId),
  );
  if (!validItems.length) return null;

  async function reorder() {
    if (busy) return;
    setBusy(true);
    setError("");
    let addedCount = 0;
    try {
      for (const item of validItems) {
        const res = await fetch("/api/public/cart/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offerId: item.offerId, qty: item.qty }),
        });
        if (res.ok) addedCount++;
      }
      if (addedCount > 0) {
        window.dispatchEvent(new Event("cartUpdated"));
        router.push("/cart");
        router.refresh();
      } else {
        setError(tr("Товары из заказа временно недоступны"));
      }
    } catch {
      setError(tr("Не удалось повторить заказ"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <button
        type="button"
        className="button button-secondary"
        disabled={busy}
        onClick={() => void reorder()}
      >
        <RotateCcw size={15} aria-hidden="true" />
        {busy ? tr("Добавляем…") : tr("Повторить заказ")}
      </button>
      {error && (
        <span role="alert" style={{ fontSize: 12, color: "oklch(var(--danger))" }}>
          {error}
        </span>
      )}
    </span>
  );
}

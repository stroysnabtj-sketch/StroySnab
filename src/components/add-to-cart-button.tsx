"use client";
import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Toast } from "@/components/ui";

export function AddToCartButton({ offerId, disabled = false, compact = false }: { offerId: string; disabled?: boolean; compact?: boolean }) {
  const [pending, setPending] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState(""); const router = useRouter();
  async function add() {
    setPending(true); setError("");
    const response = await fetch("/api/public/cart/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offerId, qty: "1" }) });
    const data = await response.json() as { error?: { message?: string } };
    setPending(false);
    if (!response.ok) { setError(data.error?.message ?? "Не удалось добавить товар"); return; }
    setMessage("Товар добавлен в корзину"); router.refresh();
  }
  return <><Button variant="primary" onClick={add} loading={pending} disabled={disabled} className={compact ? "cart-add-compact" : ""}><ShoppingCart size={16} />{disabled ? "Нет в наличии" : "В корзину"}</Button>{message && <Toast text={message} onClose={() => setMessage("")} />}{error && <Toast text={error} tone="error" onClose={() => setError("")} />}</>;
}

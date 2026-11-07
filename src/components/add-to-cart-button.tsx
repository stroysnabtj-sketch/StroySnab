"use client";
import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type MouseEvent } from "react";
import { Button, Toast } from "@/components/ui";
import { flyToCart } from "./cart-flight";

export function AddToCartButton({
  offerId,
  minOrderQty = "1",
  disabled = false,
  compact = false,
}: {
  offerId: string;
  minOrderQty?: string;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  async function add(event: MouseEvent<HTMLButtonElement>) {
    if (submitting.current) return;
    submitting.current = true;
    const button = event.currentTarget;
    const source = button.closest<HTMLElement>(".product-card") ?? button;
    setPending(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/public/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, qty: minOrderQty }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      if (!response.ok) {
        setError(data?.error?.message ?? "Не удалось добавить товар. Попробуйте ещё раз.");
        return;
      }
      setMessage("Товар добавлен в корзину");
      flyToCart(source, button);
      window.dispatchEvent(new Event("cartUpdated"));
      router.refresh();
    } catch {
      setError("Нет связи с сервером. Проверьте подключение и повторите попытку.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  return (
    <>
      <Button
        variant="primary"
        onClick={add}
        loading={pending}
        disabled={disabled}
        className={compact ? "cart-add-compact" : ""}
      >
        <ShoppingCart size={16} />
        {disabled ? "Нет в наличии" : "В корзину"}
      </Button>
      {message && <Toast text={message} onClose={() => setMessage("")} />}
      {error && <Toast text={error} tone="error" onClose={() => setError("")} />}
    </>
  );
}

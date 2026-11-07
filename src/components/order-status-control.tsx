"use client";
import { CustomSelect } from "@/components/custom-select";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TRANSITIONS } from "@/modules/orders/status";
export function OrderStatusControl({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [target, setTarget] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const options = ORDER_STATUS_TRANSITIONS[status] ?? [];
  if (!options.length) return null;
  async function save() {
    if (!target || pending) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target, expectedStatus: status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Не удалось изменить статус");
      setTarget("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Нет связи с сервером");
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="order-status-control">
      <CustomSelect
        className="input"
        aria-label="Новый статус заказа"
        value={target}
        disabled={pending}
        onChange={(e) => setTarget(e.target.value)}
      >
        <option value="">Изменить статус…</option>
        {options.map((value) => (
          <option key={value} value={value}>
            {ORDER_STATUS_LABELS[value]}
          </option>
        ))}
      </CustomSelect>
      {target === "CANCELLED" && (
        <small>Отмена вернёт резерв товара. Платёж автоматически не возвращается.</small>
      )}
      <button className="button button-secondary" disabled={!target || pending} onClick={save}>
        {pending ? "Сохранение…" : "Применить"}
      </button>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

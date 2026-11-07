"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, adminRequest } from "./admin-ui";
import { SHOP_ORDER_STATUS_LABELS, SHOP_ORDER_TRANSITIONS } from "@/modules/suppliers/order-status";
import styles from "./workspace-design.module.css";
export function ShopOrderStatusControl({
  id,
  status,
  orderStatus,
  canManage,
}: {
  id: string;
  status: string;
  orderStatus: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const next = SHOP_ORDER_TRANSITIONS[status]?.[0];
  const handoverBlocked =
    next === "HANDED_OVER" && !["CONFIRMED", "DISPATCHED"].includes(orderStatus);
  const captions: Record<string, string> = {
    ACCEPTED: "Принять заказ",
    READY: "Отметить готовым",
    HANDED_OVER: "Отметить передачу",
  };
  async function save() {
    if (busy || !next) return;
    setBusy(true);
    setError("");
    try {
      await adminRequest(`/api/seller/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, expectedStatus: status }),
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось изменить статус");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <strong>{SHOP_ORDER_STATUS_LABELS[status] ?? status}</strong>
      <p className={styles.subtle}>
        Готовность ваших товаров отмечается отдельно от общего статуса заказа.
      </p>
      {next &&
        !handoverBlocked &&
        canManage &&
        !["CANCELLED", "DELIVERED"].includes(orderStatus) && (
          <Button loading={busy} onClick={() => void save()}>
            {captions[next]}
          </Button>
        )}
      {handoverBlocked && !["CANCELLED", "DELIVERED"].includes(orderStatus) && (
        <p className={styles.subtle}>
          Передача товаров доступна после подтверждения заказа платформой.
        </p>
      )}
      {!canManage && (
        <p className={styles.alert}>
          Магазин приостановлен. Для изменения заказа свяжитесь с платформой.
        </p>
      )}
      {error && (
        <p className={styles.alert} role="alert">
          {error}
        </p>
      )}
    </>
  );
}

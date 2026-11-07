"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Modal } from "@/components/ui";
import type { CustomerProductRequestDTO } from "@/modules/product-requests/types";
import { formatTJS } from "@/modules/system/money";
import styles from "./account.module.css";

export function CustomerRequestsPanel({ request }: { request: CustomerProductRequestDTO }) {
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const labels: Record<string, string> = {
    NEW: "Новая",
    IN_REVIEW: "В обработке",
    AVAILABLE: "Товар доступен",
    UNAVAILABLE: "Недоступно",
    CANCELLED: "Отменена",
  };
  async function cancel() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/account/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          version: request.version,
          reason: reason.trim() || undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Не удалось отменить заявку");
      setCancelOpen(false);
      setReason("");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ошибка сети");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={styles.detailStack}>
      <Link href="/account/requests" className={styles.textLink}>
        ← Все заявки
      </Link>
      <section className={styles.panel}>
        <div className={styles.sectionHead}>
          <span>{new Date(request.createdAt).toLocaleDateString("ru-RU")}</span>
          <span className={styles.status}>{labels[request.status]}</span>
        </div>
        <h2>{request.productName}</h2>
        {request.quantity && (
          <p>
            Количество:{" "}
            <strong>
              {request.quantity} {request.unit}
            </strong>
          </p>
        )}
        {request.requiredDate && <p>Нужно к: {request.requiredDate}</p>}
        {request.description && <p className={styles.requestDescription}>{request.description}</p>}
      </section>
      {(request.responseNote ||
        request.status === "AVAILABLE" ||
        request.status === "UNAVAILABLE") && (
        <section className={styles.panel}>
          <h2>Ответ менеджера</h2>
          {request.responseNote && (
            <p className={styles.requestDescription}>{request.responseNote}</p>
          )}
          {request.estimatedPriceDirams !== null && (
            <p>
              Ориентировочная цена: <strong>{formatTJS(request.estimatedPriceDirams)}</strong>
              {request.unit ? ` / ${request.unit}` : ""}
            </p>
          )}
          {request.estimatedDeliveryDays !== null && (
            <p>Срок поставки: ≈ {request.estimatedDeliveryDays} дн.</p>
          )}
          {request.resolvedProductSlug && (
            <Link
              className="button button-secondary"
              href={`/product/${request.resolvedProductSlug}`}
            >
              {request.resolvedProductTitle ?? "Открыть товар"}
            </Link>
          )}
        </section>
      )}
      {["NEW", "IN_REVIEW"].includes(request.status) && (
        <div>
          <Button
            variant="ghost"
            onClick={() => {
              setError("");
              setCancelOpen(true);
            }}
          >
            Отменить заявку
          </Button>
        </div>
      )}
      <Modal
        open={cancelOpen}
        title={`Отмена ${request.number}`}
        onClose={() => {
          if (!busy) setCancelOpen(false);
        }}
      >
        <div className="stack-form">
          {error && (
            <p role="alert" className="form-alert">
              {error}
            </p>
          )}
          <label className="field">
            <span className="field-label">Причина отмены (необязательно)</span>
            <input
              className="input"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              disabled={busy}
            />
          </label>
          <div className={styles.emptyActions}>
            <Button variant="secondary" disabled={busy} onClick={() => setCancelOpen(false)}>
              Назад
            </Button>
            <Button variant="danger" loading={busy} disabled={busy} onClick={() => void cancel()}>
              Отменить заявку
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

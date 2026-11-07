"use client";
import { useState } from "react";
import {
  adminRequest,
  useAdminResource,
  ResourceState,
  DataTable,
  Button,
  Select,
  Badge,
} from "./admin-ui";
import { formatDateTime } from "@/i18n";
const states: Record<string, string> = {
  queued: "В очереди",
  accepted: "Принято поставщиком",
  delivered: "Доставлено",
  failed: "Ошибка",
};
const events: Record<string, string> = {
  ORDER_CREATED: "Новый заказ",
  ORDER_CONFIRMED: "Заказ подтверждён",
  ORDER_DISPATCHED: "Заказ отправлен",
  ORDER_DELIVERED: "Заказ доставлен",
  ORDER_CANCELLED: "Заказ отменён",
  PAYMENT_CONFIRMED: "Получена оплата",
  SHOP_STATUS_CHANGED: "Статус магазина",
  QUOTE_READY: "КП готово",
};
type Row = {
  id: string;
  event: string;
  state: string;
  recipient: string;
  attemptCount: number;
  createdAt: string;
  lastError?: string | null;
};
export function NotificationPanel({ connected }: { connected: boolean }) {
  const [state, setState] = useState(""),
    [pending, setPending] = useState(""),
    [error, setError] = useState("");
  const resource = useAdminResource<{ notifications: Row[] }>(
    `/api/admin/notifications${state ? `?state=${state}` : ""}`,
  );
  async function retry(id: string) {
    setError("");
    setPending(id);
    try {
      await adminRequest("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await resource.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending("");
    }
  }
  return (
    <>
      <div className="toolbar">
        <Select
          aria-label="Статус уведомления"
          value={state}
          onChange={(e) => setState(e.target.value)}
        >
          <option value="">Все статусы</option>
          {Object.entries(states).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
        <Button variant="secondary" onClick={() => void resource.reload()}>
          Обновить
        </Button>
        {!connected && <Badge tone="warning">Отправка не подключена</Badge>}
      </div>
      {error && (
        <p role="alert" className="form-alert">
          {error}
        </p>
      )}
      <ResourceState
        loading={resource.loading}
        error={resource.error}
        empty={!resource.data?.notifications.length}
        emptyText="Уведомлений пока нет"
        onRetry={() => void resource.reload()}
      />
      {!!resource.data?.notifications.length && (
        <DataTable headers={["Событие", "Получатель", "Время", "Статус", "Попытки", ""]}>
          {resource.data.notifications.map((row) => (
            <tr key={row.id}>
              <td>{events[row.event] ?? row.event}</td>
              <td>{row.recipient}</td>
              <td>{formatDateTime(row.createdAt)}</td>
              <td>
                <Badge
                  tone={
                    row.state === "failed"
                      ? "danger"
                      : row.state === "delivered"
                        ? "success"
                        : "neutral"
                  }
                >
                  {states[row.state] ?? row.state}
                </Badge>
              </td>
              <td>{row.attemptCount}</td>
              <td>
                {row.state === "failed" && (
                  <Button
                    variant="secondary"
                    disabled={!!pending}
                    onClick={() => void retry(row.id)}
                  >
                    Повторить
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </>
  );
}

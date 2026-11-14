"use client";
import { useState } from "react";
import { useAdminResource, ResourceState, DataTable, Button } from "./admin-ui";
import { formatDateTime } from "@/i18n";
import { formatTJS } from "@/modules/system/money";
import styles from "./workspace-design.module.css";
type Row = {
  id: string;
  entityType: string;
  label: string;
  operation: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  recordedAt: string;
};
const value = (row: Row, snapshot: Row["before"]) => {
  if (!snapshot) return "—";
  if (row.entityType === "supplier_offer")
    return formatTJS(BigInt(String(snapshot.supplierPriceDirams)));
  if (row.entityType === "product_markup") return `${snapshot.markupPercent}%`;
  return `${snapshot.type ?? ""} ${snapshot.value ?? ""}`;
};
export function PriceHistoryPanel() {
  const [page, setPage] = useState(1);
  const resource = useAdminResource<{ entries: Row[]; hasMore: boolean }>(
    `/api/admin/pricing/history?page=${page}`,
  );
  return (
    <section className={styles.panel} style={{ marginTop: 24 }}>
      <div className={styles.panelHead}>
        <h2>История цен</h2>
        <Button variant="secondary" onClick={() => void resource.reload()}>
          Обновить
        </Button>
      </div>
      <ResourceState
        loading={resource.loading}
        error={resource.error}
        empty={!resource.data?.entries.length}
        emptyText="История пуста"
        onRetry={() => void resource.reload()}
      />
      {!!resource.data?.entries.length && (
        <DataTable headers={["Дата", "Товар", "Изменение", "Было", "Стало"]}>
          {resource.data.entries.map((row) => (
            <tr key={row.id}>
              <td>{formatDateTime(row.recordedAt)}</td>
              <td>{row.label}</td>
              <td>
                {
                  (
                    {
                      supplier_offer: "Закупочная цена",
                      product_markup: "Наценка товара",
                      pricing_rule: "Правило цены",
                    } as Record<string, string>
                  )[row.entityType]
                }{" "}
                ·{" "}
                {
                  (
                    { INSERT: "Создано", UPDATE: "Изменено", DELETE: "Удалено" } as Record<
                      string,
                      string
                    >
                  )[row.operation]
                }
              </td>
              <td>{value(row, row.before)}</td>
              <td>{value(row, row.after)}</td>
            </tr>
          ))}
        </DataTable>
      )}
      <div className="toolbar">
        <Button variant="secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Назад
        </Button>
        <span>{page}</span>
        <Button
          variant="secondary"
          disabled={!resource.data?.hasMore}
          onClick={() => setPage((p) => p + 1)}
        >
          Далее
        </Button>
      </div>
    </section>
  );
}

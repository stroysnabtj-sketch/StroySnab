"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Input, Pagination, Select, DataTable } from "@/components/admin-ui";
import type { ProductRequestDTO } from "@/modules/product-requests/types";

function getStatusBadge(status: string) {
  switch (status) {
    case "NEW":
      return <Badge tone="warning">Новая</Badge>;
    case "IN_REVIEW":
      return <Badge tone="info">В обработке</Badge>;
    case "AVAILABLE":
      return <Badge tone="success">Доступно</Badge>;
    case "UNAVAILABLE":
      return <Badge tone="danger">Недоступно</Badge>;
    case "CANCELLED":
      return <Badge tone="neutral">Отменена</Badge>;
    default:
      return <Badge tone="neutral">{status}</Badge>;
  }
}

export function AdminProductRequestsPanel({
  items,
  total,
  page,
  pageSize,
  status,
  q,
}: {
  items: ProductRequestDTO[];
  total: number;
  page: number;
  pageSize: number;
  status?: string;
  q?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(q ?? "");
  const [statusFilter, setStatusFilter] = useState(status ?? "");

  const totalPages = Math.ceil(total / pageSize);

  function applyFilters(newStatus = statusFilter, newSearch = searchTerm, newPage = 1) {
    const params = new URLSearchParams(searchParams.toString());
    if (newStatus) params.set("status", newStatus);
    else params.delete("status");

    if (newSearch.trim()) params.set("q", newSearch.trim());
    else params.delete("q");

    if (newPage > 1) params.set("page", String(newPage));
    else params.delete("page");

    router.push(`/admin/product-requests?${params.toString()}`);
  }

  return (
    <div className="stack-form">
      <div className="panel-toolbar">
        <label className="field">
          <span className="field-label">Поиск</span>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters(statusFilter, searchTerm, 1)}
            placeholder="Номер, товар, имя, телефон, e-mail"
          />
        </label>

        <label className="field">
          <span className="field-label">Статус</span>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              applyFilters(e.target.value, searchTerm, 1);
            }}
          >
            <option value="">Все статусы</option>
            <option value="NEW">Новые</option>
            <option value="IN_REVIEW">В обработке</option>
            <option value="AVAILABLE">Доступно</option>
            <option value="UNAVAILABLE">Недоступно</option>
            <option value="CANCELLED">Отменено</option>
          </Select>
        </label>

        <Button type="button" onClick={() => applyFilters(statusFilter, searchTerm, 1)}>
          Найти
        </Button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "14px",
          color: "oklch(var(--muted))",
        }}
      >
        <span>
          Найдено заявок: <strong>{total}</strong>
        </span>
        <span>
          Страница {page} из {Math.max(1, totalPages)}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="card empty" style={{ textAlign: "center", padding: "48px 24px" }}>
          <h3>Заявок не найдено</h3>
          <p style={{ color: "oklch(var(--muted))", marginTop: "8px" }}>
            Попробуйте изменить параметры поиска или фильтр по статусу.
          </p>
        </div>
      ) : (
        <DataTable
          headers={[
            "Номер",
            "Дата",
            "Товар",
            "Количество",
            "Контакт",
            "Статус",
            "Ответственный",
            "Действия",
          ]}
        >
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <strong>{item.number}</strong>
              </td>
              <td>{new Date(item.createdAt).toLocaleDateString("ru-RU")}</td>
              <td>
                <span style={{ fontWeight: 500 }}>{item.productName}</span>
              </td>
              <td>{item.quantity ? `${item.quantity} ${item.unit ?? ""}` : "—"}</td>
              <td>
                <div>{item.contactName}</div>
                <small style={{ color: "oklch(var(--muted))" }}>{item.contactPhone}</small>
              </td>
              <td>{getStatusBadge(item.status)}</td>
              <td>{item.assignedToName ?? "—"}</td>
              <td>
                <Link
                  className="button button-secondary"
                  href={`/admin/product-requests/${item.id}`}
                >
                  Открыть
                </Link>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <Pagination
        page={page}
        pages={totalPages}
        onPage={(newPage) => applyFilters(statusFilter, searchTerm, newPage)}
      />
    </div>
  );
}

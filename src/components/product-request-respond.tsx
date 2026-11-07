"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "@/components/workspace-design.module.css";
import { Badge, Button, Field, Input, Select, Textarea } from "@/components/ui";
import type { ManagedProductRequestDetailDTO } from "@/modules/product-requests/types";
import { fromDirams, toDirams } from "@/modules/system/money";

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

export function ProductRequestRespond({
  request,
}: {
  request: ManagedProductRequestDetailDTO;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const initialSomoni = request.estimatedPriceDirams
    ? fromDirams(BigInt(request.estimatedPriceDirams)).toString()
    : "";

  const [form, setForm] = useState({
    status:
      request.status === "NEW"
        ? "IN_REVIEW"
        : (request.status as "IN_REVIEW" | "AVAILABLE" | "UNAVAILABLE"),
    responseNote: request.responseNote ?? "",
    estimatedPriceSomoni: initialSomoni,
    estimatedDeliveryDays: request.estimatedDeliveryDays?.toString() ?? "",
    resolvedProductId: request.resolvedProductId ?? "",
    resolvedProductTitle: request.resolvedProductTitle ?? "",
  });

  const [productQuery, setProductQuery] = useState("");
  const [productSearchResults, setProductSearchResults] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [searchingProducts, setSearchingProducts] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);

  async function searchCatalog(query: string) {
    setProductQuery(query);
    if (!query || query.trim().length < 2) {
      setProductSearchResults([]);
      return;
    }
    setSearchingProducts(true);
    try {
      const res = await fetch(`/api/admin/catalog/products?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (res.ok && data.items) {
        setProductSearchResults(data.items.slice(0, 5));
      }
    } catch {
      // ignore
    } finally {
      setSearchingProducts(false);
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitted = new FormData(e.currentTarget);
    const submittedStatus = String(submitted.get("status") ?? "IN_REVIEW") as
      "IN_REVIEW" | "AVAILABLE" | "UNAVAILABLE";
    const submittedNote = String(submitted.get("responseNote") ?? "").trim();
    const submittedPrice = String(submitted.get("estimatedPriceSomoni") ?? "").trim();
    const submittedDays = String(submitted.get("estimatedDeliveryDays") ?? "");
    const submittedProductId = String(submitted.get("resolvedProductId") ?? "");
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setSuccessMessage(null);
    setConflict(false);

    let diramsString: string | null = null;
    if (submittedPrice) {
      try {
        diramsString = toDirams(submittedPrice).toString();
      } catch {
        setFieldErrors({ estimatedPriceSomoni: "Некорректная сумма в сомони" });
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch(`/api/product-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: submittedStatus,
          responseNote: submittedNote || null,
          estimatedPriceDirams: diramsString,
          estimatedDeliveryDays: submittedDays ? Number(submittedDays) : null,
          resolvedProductId: submittedStatus === "AVAILABLE" ? submittedProductId || null : null,
          version: request.version,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setConflict(true);
          setError(
            result.error?.message ?? "Заявка была изменена другим сотрудником. Обновите страницу.",
          );
        } else {
          setFieldErrors(result.error?.fields ?? {});
          setError(result.error?.message ?? "Ошибка сохранения ответа");
        }
        return;
      }

      setSuccessMessage("Ответ сохранён успешно");
      router.refresh();
    } catch {
      setError("Ошибка сети при отправке ответа");
    } finally {
      setLoading(false);
    }
  }

  const isCancelled = request.status === "CANCELLED";

  return (
    <div className={styles.detailGrid}>
      <div className="stack-form">
        {/* Header & Badges */}
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h2 style={{ margin: 0 }}>{request.number}</h2>
              {getStatusBadge(request.status)}
            </div>
            <span style={{ fontSize: "14px", color: "oklch(var(--muted))" }}>
              Версия: {request.version}
            </span>
          </div>

          <div style={{ marginTop: "16px", display: "grid", gap: "8px", fontSize: "15px" }}>
            <div>
              <strong>Товар:</strong> {request.productName}
            </div>
            {request.quantity ? (
              <div>
                <strong>Количество:</strong> {request.quantity} {request.unit ?? ""}
              </div>
            ) : null}
            {request.description ? (
              <div>
                <strong>Описание:</strong>
                <p
                  style={{
                    margin: "4px 0 0",
                    color: "oklch(var(--muted))",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {request.description}
                </p>
              </div>
            ) : null}
            {request.requiredDate ? (
              <div>
                <strong>Нужен к дате:</strong> {request.requiredDate}
              </div>
            ) : null}
          </div>
        </div>

        {/* Response Form */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ margin: "0 0 16px" }}>Ответ на заявку</h3>

          {conflict ? (
            <div className="form-alert" role="alert" style={{ marginBottom: "16px" }}>
              <p>{error}</p>
              <Button type="button" variant="secondary" onClick={() => router.refresh()}>
                Обновить данные страницы
              </Button>
            </div>
          ) : error ? (
            <div className="form-alert" role="alert" style={{ marginBottom: "16px" }}>
              {error}
            </div>
          ) : null}

          {successMessage && (
            <div className="form-success" role="status" style={{ marginBottom: "16px" }}>
              {successMessage}
            </div>
          )}

          {isCancelled ? (
            <div className="form-alert" role="alert">
              Эта заявка отменена покупателем. Редактирование ответа заблокировано.
            </div>
          ) : (
            <form onSubmit={submit} className="stack-form" noValidate>
              <fieldset
                disabled={!ready || loading}
                className="stack-form"
                style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
              >
                <Field label="Статус *" error={fieldErrors.status}>
                  <Select
                    name="status"
                    value={form.status}
                    onChange={(e) =>
                      setForm((old) => ({
                        ...old,
                        status: e.target.value as "IN_REVIEW" | "AVAILABLE" | "UNAVAILABLE",
                      }))
                    }
                  >
                    <option value="IN_REVIEW">В обработке (IN_REVIEW)</option>
                    <option value="AVAILABLE">Доступно (AVAILABLE)</option>
                    <option value="UNAVAILABLE">Недоступно (UNAVAILABLE)</option>
                  </Select>
                </Field>

                <Field
                  label={`Комментарий для покупателя ${form.status === "AVAILABLE" || form.status === "UNAVAILABLE" ? "*" : ""}`}
                  hint={`${form.responseNote.length}/2000 символов`}
                  error={fieldErrors.responseNote}
                >
                  <Textarea
                    name="responseNote"
                    maxLength={2000}
                    value={form.responseNote}
                    onChange={(e) => setForm((old) => ({ ...old, responseNote: e.target.value }))}
                    placeholder="Укажите условия поставки, причину отказа или детали"
                    rows={4}
                  />
                </Field>

                <div className="form-grid">
                  <Field
                    label={`Ориентировочная цена (TJS)${request.unit ? ` за 1 ${request.unit}` : ""}`}
                    error={fieldErrors.estimatedPriceSomoni}
                  >
                    <Input
                      name="estimatedPriceSomoni"
                      inputMode="decimal"
                      value={form.estimatedPriceSomoni}
                      onChange={(e) =>
                        setForm((old) => ({ ...old, estimatedPriceSomoni: e.target.value }))
                      }
                      placeholder="Например: 8500.00"
                    />
                  </Field>

                  <Field label="Срок поставки (дней)" error={fieldErrors.estimatedDeliveryDays}>
                    <Input
                      name="estimatedDeliveryDays"
                      type="number"
                      min={0}
                      max={365}
                      value={form.estimatedDeliveryDays}
                      onChange={(e) =>
                        setForm((old) => ({ ...old, estimatedDeliveryDays: e.target.value }))
                      }
                      placeholder="Например: 5"
                    />
                  </Field>
                </div>

                {form.status === "AVAILABLE" && (
                  <div
                    className="card"
                    style={{ padding: "16px", background: "oklch(var(--surface-muted) / 0.3)" }}
                  >
                    <input type="hidden" name="resolvedProductId" value={form.resolvedProductId} />
                    <span className="field-label" style={{ display: "block", marginBottom: "8px" }}>
                      Привязка к товару каталога (необязательно)
                    </span>

                    {form.resolvedProductId ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "8px",
                        }}
                      >
                        <span>
                          Выбран товар:{" "}
                          <strong>{form.resolvedProductTitle || form.resolvedProductId}</strong>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            setForm((old) => ({
                              ...old,
                              resolvedProductId: "",
                              resolvedProductTitle: "",
                            }))
                          }
                        >
                          Очистить
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Input
                          value={productQuery}
                          onChange={(e) => searchCatalog(e.target.value)}
                          placeholder="Поиск по названию или артикулу для привязки..."
                        />
                        {searchingProducts && <small>Поиск...</small>}
                        {productSearchResults.length > 0 && (
                          <ul
                            style={{
                              listStyle: "none",
                              padding: 0,
                              margin: "8px 0 0",
                              border: "1px solid oklch(var(--line))",
                              borderRadius: "8px",
                            }}
                          >
                            {productSearchResults.map((p) => (
                              <li
                                key={p.id}
                                style={{
                                  padding: "8px 12px",
                                  borderBottom: "1px solid oklch(var(--line))",
                                  cursor: "pointer",
                                }}
                                onClick={() => {
                                  setForm((old) => ({
                                    ...old,
                                    resolvedProductId: p.id,
                                    resolvedProductTitle: p.title,
                                  }));
                                  setProductSearchResults([]);
                                  setProductQuery("");
                                }}
                              >
                                {p.title}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <Button type="submit" loading={loading}>
                  Сохранить ответ
                </Button>
              </fieldset>
            </form>
          )}
        </div>

        {/* History Audit Log */}
        {request.history.length > 0 && (
          <div className="card" style={{ padding: "24px" }}>
            <h3 style={{ margin: "0 0 16px" }}>История изменений</h3>
            <div style={{ display: "grid", gap: "12px" }}>
              {request.history.map((entry) => {
                const dateStr = new Date(entry.createdAt).toLocaleString("ru-RU");
                const data = entry.data ?? {};
                return (
                  <div
                    key={entry.id}
                    style={{
                      padding: "10px 14px",
                      background: "oklch(var(--surface-muted) / 0.3)",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        color: "oklch(var(--muted))",
                      }}
                    >
                      <span>
                        {entry.action} ({entry.actorRole})
                      </span>
                      <span>{dateStr}</span>
                    </div>
                    {data.newStatus ? (
                      <div style={{ marginTop: "4px" }}>
                        Статус: <strong>{String(data.previousStatus ?? "—")}</strong> →{" "}
                        <strong>{String(data.newStatus)}</strong>
                      </div>
                    ) : null}
                    {data.reason ? (
                      <div style={{ marginTop: "4px" }}>
                        Причина: <em>{String(data.reason)}</em>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar: Contacts & Assignee */}
      <aside className="stack-form">
        <div className="card" style={{ padding: "20px" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "16px" }}>Контакты заявителя</h3>
          <div style={{ display: "grid", gap: "8px", fontSize: "14px" }}>
            <div>
              <span style={{ color: "oklch(var(--muted))" }}>Имя:</span>
              <div style={{ fontWeight: 500 }}>{request.contactName}</div>
            </div>
            <div>
              <span style={{ color: "oklch(var(--muted))" }}>Телефон:</span>
              <div>
                <a className="inline-link" href={`tel:${request.contactPhone}`}>
                  {request.contactPhone}
                </a>
              </div>
            </div>
            {request.contactEmail && (
              <div>
                <span style={{ color: "oklch(var(--muted))" }}>E-mail:</span>
                <div>
                  <a className="inline-link" href={`mailto:${request.contactEmail}`}>
                    {request.contactEmail}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: "20px" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "16px" }}>Ответственный менеджер</h3>
          <div style={{ fontSize: "14px" }}>
            {request.assignedToName ? (
              <div>
                <strong>{request.assignedToName}</strong>
              </div>
            ) : (
              <span style={{ color: "oklch(var(--muted))" }}>
                Ещё не назначен (будет назначен при первом ответе)
              </span>
            )}
          </div>
        </div>

        <Link
          className="button button-secondary"
          href="/admin/product-requests"
          style={{ textAlign: "center" }}
        >
          ← Ко всем заявкам
        </Link>
      </aside>
    </div>
  );
}

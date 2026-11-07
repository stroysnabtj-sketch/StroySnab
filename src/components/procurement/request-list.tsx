"use client";
import { CustomSelect } from "@/components/custom-select";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { api, money, statuses, paymentLabels } from "./shared";
import s from "./procurement.module.css";
type Result = {
  items: {
    id: string;
    number: string;
    title: string;
    status: string;
    contactName: string;
    createdAt: string;
    quoteNumber: string | null;
    totalDirams: string | null;
    payment: null | { status: string; balanceDirams: string };
  }[];
  total: number;
  page: number;
  pages: number;
};
export function ProcurementList({ manager = false }: { manager?: boolean }) {
  const [result, setResult] = useState<Result | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [payment, setPayment] = useState("");
  async function load(page = 1) {
    setBusy(true);
    setError("");
    try {
      const params = new URLSearchParams({ q: query, status, payment, page: String(page) });
      setResult(await api<Result>(`/api/procurement?${params}`, { cache: "no-store" }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function filter(e: FormEvent) {
    e.preventDefault();
    void load();
  }
  return (
    <div className={s.stack}>
      <form onSubmit={filter} className={s.filters} aria-label="Фильтры заявок">
        <label className={s.field}>
          Поиск
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Номер или название"
            maxLength={200}
          />
        </label>
        <label className={s.field}>
          Статус
          <CustomSelect value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Все статусы</option>
            {Object.entries(statuses).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </CustomSelect>
        </label>
        {manager && (
          <label className={s.field}>
            Оплата
            <CustomSelect value={payment} onChange={(e) => setPayment(e.target.value)}>
              <option value="">Любая</option>
              <option value="NO_ORDER">Без заказа</option>
              {Object.entries(paymentLabels).map(([v, label]) => (
                <option value={v} key={v}>
                  {label}
                </option>
              ))}
            </CustomSelect>
          </label>
        )}
        <button
          className="button button-primary"
          disabled={busy}
          style={{ alignSelf: "end", flexGrow: 0 }}
        >
          {busy ? "Загружаем…" : "Показать"}
        </button>
      </form>
      {error && (
        <div role="alert" className={s.error}>
          {error}
          <button className="button button-secondary" onClick={() => void load()}>
            Повторить
          </button>
        </div>
      )}
      <section className={s.card} aria-busy={busy}>
        {!result ? (
          <p role="status">Загружаем заявки…</p>
        ) : !result.items.length ? (
          <>
            <h2>Заявок пока нет</h2>
            <p className={s.hint}>
              Измените фильтры
              {!manager ? " или отправьте список материалов для расчёта стоимости" : ""}.
            </p>
            {!manager && (
              <Link className="button button-primary" href="/request">
                Отправить заявку
              </Link>
            )}
          </>
        ) : (
          <>
            <p className={s.hint}>Найдено: {result.total}</p>
            {result.items.map((r) => (
              <Link
                className={s.requestLink}
                key={r.id}
                href={`${manager ? "/admin/procurement" : "/requests"}/${r.id}`}
              >
                <div className={s.row}>
                  <span className="eyebrow">{r.number}</span>
                  <span className={s.badge}>{statuses[r.status] ?? r.status}</span>
                </div>
                <h2>{r.title}</h2>
                <div className={s.row}>
                  <span className={s.hint}>
                    {manager ? `${r.contactName} · ` : ""}
                    {new Date(r.createdAt).toLocaleDateString("ru-RU")}
                    {r.quoteNumber ? ` · ${r.quoteNumber}` : ""}
                  </span>
                  <strong>{money(r.totalDirams ?? undefined)}</strong>
                </div>
                {r.payment && (
                  <p className={s.hint}>
                    {paymentLabels[r.payment.status]} · Остаток {money(r.payment.balanceDirams)}
                  </p>
                )}
              </Link>
            ))}
          </>
        )}
      </section>
      {result && result.pages > 1 && (
        <nav className={s.actions} aria-label="Страницы заявок">
          <button
            className="button button-secondary"
            disabled={busy || result.page <= 1}
            onClick={() => void load(result.page - 1)}
          >
            Назад
          </button>
          <span>
            {result.page} / {result.pages}
          </span>
          <button
            className="button button-secondary"
            disabled={busy || result.page >= result.pages}
            onClick={() => void load(result.page + 1)}
          >
            Далее
          </button>
        </nav>
      )}
    </div>
  );
}

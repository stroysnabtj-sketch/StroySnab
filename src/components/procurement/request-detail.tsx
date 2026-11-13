"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { AddressFields, type AddressValue } from "@/components/address-fields";
import { api, money, statuses, paymentLabels, type Detail } from "./shared";
import { QuotationEditor } from "./quotation-editor";
import s from "./procurement.module.css";
export function ProcurementDetail({
  id,
  access = "",
  manager = false,
  customer = false,
}: {
  id: string;
  access?: string;
  manager?: boolean;
  customer?: boolean;
}) {
  const [data, setData] = useState<Detail | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [address, setAddress] = useState<AddressValue>({ city: "Душанбе", street: "", point: null }),
    [loaded, setLoaded] = useState(false),
    [decision, setDecision] = useState(false);
  const downloaded = useRef<string | null>(null);
  const headers: Record<string, string> = access ? { "x-request-access": access } : {};
  async function refresh() {
    setError("");
    try {
      setData(await api<Detail>(`/api/procurement/${id}`, { headers, cache: "no-store" }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoaded(true);
    }
  }
  useEffect(() => {
    void refresh(); /* request identity controls reload */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, access]);
  const ownRequest = customer && !access && data?.request.id === id;
  const waitingForQuote =
    (ownRequest && !data.quotation && ["NEW", "IN_REVIEW"].includes(data.request.status)) ||
    !!(data?.preparation && ["queued", "processing"].includes(data.preparation.state));
  useEffect(() => {
    if (!waitingForQuote) return;
    const controller = new AbortController();
    let checking = false;
    const interval = window.setInterval(async () => {
      if (document.hidden || checking) return;
      checking = true;
      try {
        const detail = await api<Detail>(`/api/procurement/${id}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setData(detail);
      } catch {
        // A temporary error leaves the last loaded request visible.
      } finally {
        checking = false;
      }
    }, 15000);
    return () => {
      window.clearInterval(interval);
      controller.abort();
    };
  }, [id, waitingForQuote]);
  const downloadKey =
    ownRequest && data.quotation?.status === "SENT"
      ? `quote-pdf:${id}:${data.quotation.version}`
      : null;
  useEffect(() => {
    if (!downloadKey || downloaded.current === downloadKey) return;
    downloaded.current = downloadKey;
    try {
      if (sessionStorage.getItem(downloadKey)) return;
      sessionStorage.setItem(downloadKey, "1");
    } catch {
      // The ref also prevents repeated attempts when storage is unavailable.
    }
    const link = document.createElement("a");
    link.href = `/api/procurement/${id}/pdf`;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, [downloadKey, id]);
  async function decide(action: "ACCEPT" | "DECLINE") {
    if (!data?.quotation) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/procurement/${id}/quotation`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          version: data.quotation.version,
          deliveryAddress: address.street,
          deliveryCity: address.city,
          deliveryLat: address.point?.lat,
          deliveryLng: address.point?.lng,
        }),
      });
      setDecision(false);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const resource = (path: string) =>
    `/api/procurement/${id}/${path}${access ? `?access=${encodeURIComponent(access)}` : ""}`;
  if (!data)
    return (
      <section className={s.card} aria-busy={!loaded}>
        {error ? (
          <>
            <div className={s.error} role="alert">
              {error}
            </div>
            <button className="button button-secondary" onClick={() => void refresh()}>
              Повторить
            </button>
          </>
        ) : (
          <p role="status">Загружаем заявку…</p>
        )}
      </section>
    );
  const { request: r, quotation: q } = data;
  const expired = q ? new Date(q.validUntil).getTime() <= Date.now() : false;
  return (
    <div className={s.stack}>
      <header className={s.head}>
        <div>
          <span className="eyebrow">Заявка {r.number}</span>
          <h1>{r.title}</h1>
          <span className={s.badge}>{statuses[r.status] ?? r.status}</span>
        </div>
        <Link
          className="button button-secondary"
          href={manager ? "/admin/procurement" : "/account/procurement"}
        >
          {manager ? "Все заявки" : "Мои закупки"}
        </Link>
      </header>
      {data.preparation && (
        <section className={s.card} role="status" aria-live="polite">
          <h2>
            {
              (
                {
                  queued: "Список принят",
                  processing: "Готовим расчёт",
                  review: "Список передан менеджеру",
                  ready: "Расчёт на проверке",
                  failed: "Файл передан менеджеру",
                } as Record<string, string>
              )[data.preparation.state]
            }
          </h2>
          <p>
            {["queued", "processing"].includes(data.preparation.state)
              ? "Распознаём материалы и проверяем каталог."
              : "Менеджер проверит состав, цены и условия поставки."}
          </p>
          {manager && data.preparation.state === "failed" && (
            <button
              className="button button-secondary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api(`/api/procurement/${id}/ai`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: "{}",
                  });
                  await refresh();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Повторить распознавание
            </button>
          )}
          {manager && data.preparation.lines?.some((l) => l.issue) && (
            <ul>
              {data.preparation.lines
                .filter((l) => l.issue)
                .map((l, i) => (
                  <li key={i}>
                    {l.name}: {l.issue}
                  </li>
                ))}
            </ul>
          )}
          {manager && data.preparation.warnings?.map((warning, i) => <p key={i}>{warning}</p>)}
        </section>
      )}
      {error && (
        <div className={s.error} role="alert">
          {error}
        </div>
      )}
      <div className={s.layout}>
        <div className={s.stack}>
          <section className={s.card}>
            <h2>Исходный список</h2>
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Материал</th>
                    <th>Количество</th>
                  </tr>
                </thead>
                <tbody>
                  {r.lines.map((l, i) => (
                    <tr key={i}>
                      <td>
                        {l.name}
                        {!!l.imageIds?.length && (
                          <div className={s.linePhotos}>
                            {l.imageIds.map((imageId) => (
                              <a
                                key={imageId}
                                href={`/api/procurement/${id}/images/${imageId}${access ? `?access=${encodeURIComponent(access)}` : ""}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Image
                                  src={`/api/procurement/${id}/images/${imageId}${access ? `?access=${encodeURIComponent(access)}` : ""}`}
                                  alt={l.name}
                                  width={60}
                                  height={60}
                                  unoptimized
                                />
                              </a>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        {l.qty} {l.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {r.note && <p className={s.note}>{r.note}</p>}
          </section>
          {q && (
            <section className={`${s.card} ${s.quotation}`}>
              <div className={s.row}>
                <h2>Коммерческое предложение {q.number}</h2>
                <a className="button button-secondary" href={resource("pdf")} download>
                  Скачать PDF
                </a>
              </div>
              <p className={s.hint}>
                Версия {q.version} · Действует до {new Date(q.validUntil).toLocaleString("ru-RU")}
                {expired && q.status === "SENT" ? " · Срок истёк" : ""}
              </p>
              <div className={s.tableWrap}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>Материал</th>
                      <th>Кол-во</th>
                      <th>Цена</th>
                      <th>Сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.lines.map((l, i) => (
                      <tr key={i}>
                        <td>
                          {l.name}
                          {!!l.imageIds?.length && (
                            <div className={s.linePhotos}>
                              {l.imageIds.map((imageId) => (
                                <a
                                  key={imageId}
                                  href={`/api/procurement/${id}/images/${imageId}${access ? `?access=${encodeURIComponent(access)}` : ""}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Image
                                    src={`/api/procurement/${id}/images/${imageId}${access ? `?access=${encodeURIComponent(access)}` : ""}`}
                                    alt={l.name}
                                    width={60}
                                    height={60}
                                    unoptimized
                                  />
                                </a>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>
                          {l.qty} {l.unit}
                        </td>
                        <td>{money(l.priceDirams)}</td>
                        <td>{money(l.subtotalDirams)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <dl className={s.details} style={{ marginTop: 18 }}>
                <div>
                  <dt>Доставка</dt>
                  <dd>{money(q.deliveryDirams)}</dd>
                </div>
              </dl>
              <p className={s.total}>Итого: {money(q.totalDirams)}</p>
              {q.conditions && <p className={s.note}>{q.conditions}</p>}
              {!manager && q.status === "SENT" && !expired && (
                <div>
                  <AddressFields value={address} onChange={setAddress} canSave={customer} />
                  <div className={s.actions}>
                    <button
                      className="button button-primary"
                      disabled={busy || address.street.trim().length < 5 || !address.point}
                      onClick={() => void decide("ACCEPT")}
                    >
                      {busy ? "Сохраняем…" : "Принять КП и создать заказ"}
                    </button>
                    <button
                      className="button button-secondary"
                      disabled={busy}
                      onClick={() => setDecision(true)}
                    >
                      Отклонить КП
                    </button>
                  </div>
                  {decision && (
                    <div className={s.error} style={{ marginTop: 16 }}>
                      <p>Отклонить это предложение? Менеджер увидит ваш отказ.</p>
                      <div className={s.actions}>
                        <button
                          className="button button-secondary"
                          disabled={busy}
                          onClick={() => setDecision(false)}
                        >
                          Оставить КП
                        </button>
                        <button
                          className="button button-secondary"
                          disabled={busy}
                          onClick={() => void decide("DECLINE")}
                        >
                          Подтвердить отказ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {q.status === "ACCEPTED" && (
                <p className={s.success}>Предложение принято. Заказ создан.</p>
              )}
              {q.status === "DECLINED" && <p className={s.hint}>Предложение отклонено.</p>}
              {!manager && expired && q.status === "SENT" && (
                <p className={s.error}>
                  Срок предложения истёк. Свяжитесь с менеджером для обновления КП.
                </p>
              )}
            </section>
          )}
          {!q && !manager && (
            <section className={s.card}>
              <h2>Готовим предложение</h2>
              <p className="muted">
                Менеджер проверит материалы и опубликует здесь цены, условия и срок действия КП.
              </p>
            </section>
          )}
          {manager &&
            data.isManager &&
            !["queued", "processing"].includes(data.preparation?.state ?? "") &&
            !["ACCEPTED", "COMPLETED", "CANCELLED"].includes(r.status) && (
              <QuotationEditor
                key={`${q?.version ?? 0}-${r.status}`}
                detail={data}
                onSaved={refresh}
              />
            )}
        </div>
        <aside className={s.stack}>
          <section className={s.card}>
            <h2>Контакты</h2>
            <p>
              {r.contactName}
              <br />
              <a href={`tel:${r.contactPhone}`}>{r.contactPhone}</a>
              {r.contactEmail && (
                <>
                  <br />
                  <a href={`mailto:${r.contactEmail}`}>{r.contactEmail}</a>
                </>
              )}
            </p>
            <p className={s.hint}>Создана {new Date(r.createdAt).toLocaleDateString("ru-RU")}</p>
          </section>
          <section className={s.card}>
            <h2>Файлы ({data.attachments.length})</h2>
            {data.attachments.length ? (
              <ul className={s.files}>
                {data.attachments.map((file) => (
                  <li key={file.id}>
                    <a
                      href={resource(`attachments/${file.id}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {file.name}
                    </a>
                    <br />
                    <span className={s.hint}>{Math.ceil(file.size / 1024)} КБ</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={s.hint}>Файлы не приложены.</p>
            )}
          </section>
          {r.orderId && (
            <section className={s.card}>
              <h2>Заказ и оплата</h2>
              {data.payment && (
                <>
                  <span className={s.badge}>
                    {paymentLabels[data.payment.status] ?? data.payment.status}
                  </span>
                  <dl className={s.details} style={{ marginTop: 16 }}>
                    <div>
                      <dt>Получено</dt>
                      <dd>{money(data.payment.paidDirams)}</dd>
                    </div>
                    <div>
                      <dt>Остаток</dt>
                      <dd>{money(data.payment.balanceDirams)}</dd>
                    </div>
                  </dl>
                  <p className={s.hint}>Отображаются поступления, зарегистрированные менеджером.</p>
                </>
              )}
              <Link
                className="button button-primary"
                prefetch={false}
                href={`${manager ? "/admin/orders" : "/orders"}/${r.orderId}${!manager && access ? `?access=${encodeURIComponent(access)}` : ""}`}
              >
                Открыть заказ
              </Link>
            </section>
          )}
          {access && (
            <p className={s.hint}>
              Эта ссылка даёт доступ к заявке. Сохраните её и не передавайте посторонним.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

"use client";
import { useState, type FormEvent } from "react";
import { api, toDirams, fromDirams, money, type Detail } from "./shared";
import { LineEditor, type EditableLine } from "./line-editor";
import s from "./procurement.module.css";
import type { QuotationPreparation } from "@/modules/procurement/preparation";
export function QuotationEditor({
  detail,
  onSaved,
}: {
  detail: Detail;
  onSaved: () => Promise<void>;
}) {
  const q = detail.quotation,
    r = detail.request;
  const [lines, setLines] = useState<EditableLine[]>(
      (q?.lines ?? r.lines).map((l) => ({
        ...l,
        id: l.id ?? crypto.randomUUID(),
        price: l.basePriceDirams ? fromDirams(l.basePriceDirams) : "",
      })),
    ),
    [delivery, setDelivery] = useState(fromDirams(q?.deliveryDirams)),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [reason, setReason] = useState("");
  const [preparation, setPreparation] = useState<QuotationPreparation | null>(null);
  async function prepare() {
    setBusy(true);
    setError("");
    try {
      setPreparation(
        await api<QuotationPreparation>(`/api/procurement/${r.id}/prepare`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lines: lines.map(({ name, qty, unit }) => ({ name, qty, unit })),
          }),
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const date = new Date(q?.validUntil ?? Date.now() + 7 * 86400000);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const send = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "send";
    setBusy(true);
    setError("");
    try {
      const data = new FormData(form);
      await api(`/api/procurement/${r.id}/quotation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: q?.version ?? 0,
          send,
          validUntil: new Date(String(data.get("validUntil"))).toISOString(),
          conditions: data.get("conditions"),
          deliveryDirams: toDirams(delivery),
          lines: lines.map((l) => ({
            id: l.id,
            imageIds: l.imageIds ?? [],
            name: l.name,
            qty: l.qty.replace(",", "."),
            unit: l.unit,
            offerId: l.offerId || undefined,
            basePriceDirams: toDirams(l.price ?? ""),
            markupPercent: l.offerId ? undefined : (l.markupPercent ?? "7"),
          })),
        }),
      });
      setNotice(send ? "КП отправлено покупателю" : "Черновик сохранён");
      await onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function status(status: "IN_REVIEW" | "REJECTED") {
    setBusy(true);
    setError("");
    try {
      await api(`/api/procurement/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason }),
      });
      await onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={s.card}>
      <h2>{q ? "Редактировать КП" : "Подготовить КП"}</h2>
      <p className={s.hint}>
        Введите закупочные цены. Для товаров каталога применяется наценка из карточки товара, для
        отдельных позиций укажите её в строке.
      </p>
      {q?.baseDirams && (
        <p className={s.hint}>
          В сохранённой версии: закупка {money(q.baseDirams)}, наценка ({money(q.markupDirams)}).
        </p>
      )}
      <div className={s.preparation}>
        <div className={s.actions}>
          <button
            className="button button-secondary"
            type="button"
            disabled={busy}
            onClick={() => void prepare()}
          >
            {busy ? "Подбираем…" : "Подобрать из каталога"}
          </button>
        </div>
        <p className={s.hint}>
          Поиск по базе без внешнего ИИ. Проверьте характеристики и предложения перед сохранением
          КП.
        </p>
        {preparation && (
          <div className={s.stack}>
            {preparation.lines.map((row) => (
              <div className={s.preparationLine} key={row.index}>
                <strong>
                  {row.index + 1}. {row.requested.name}
                </strong>
                <span className={s.hint}>
                  {row.requested.qty} {row.requested.unit}
                </span>
                {!row.candidates.length && (
                  <p className={s.hint}>
                    Не найдено. Уточните название или подберите материал вручную.
                  </p>
                )}
                {row.candidates.map((candidate) => {
                  const current = lines[row.index];
                  const stale =
                    !current ||
                    current.name !== row.requested.name ||
                    current.qty !== row.requested.qty ||
                    current.unit !== row.requested.unit;
                  const compatible =
                    candidate.unitMatches && candidate.enoughStock && candidate.minimumMet;
                  return (
                    <div className={s.preparationOffer} key={candidate.offerId}>
                      <div>
                        <strong>{candidate.productName}</strong>
                        <p>
                          {candidate.supplierName} · {money(candidate.basePriceDirams)} /{" "}
                          {candidate.unit}
                        </p>
                        <p>
                          {candidate.exact
                            ? "Совпадает название или артикул"
                            : "Похожее название — проверьте характеристики"}{" "}
                          · Срок: {candidate.leadTimeDays} дн.
                        </p>
                        {!candidate.unitMatches && (
                          <p className={s.warning}>
                            Единица отличается: требуется пересчёт вручную
                          </p>
                        )}
                        {!candidate.enoughStock && (
                          <p className={s.warning}>Недостаточно свободного остатка</p>
                        )}
                        {!candidate.minimumMet && (
                          <p className={s.warning}>
                            Минимальный заказ: {candidate.minOrderQty} {candidate.unit}
                          </p>
                        )}
                        {stale && <p className={s.hint}>Строка изменена. Обновите подбор.</p>}
                      </div>
                      <button
                        type="button"
                        className="button button-secondary"
                        disabled={busy || stale || !compatible}
                        onClick={() => {
                          setLines((old) =>
                            old.map((line, i) =>
                              i === row.index
                                ? {
                                    ...line,
                                    name: candidate.productName,
                                    unit: candidate.unit,
                                    offerId: candidate.offerId,
                                    price: fromDirams(candidate.basePriceDirams),
                                    markupPercent: candidate.markupPercent,
                                  }
                                : line,
                            ),
                          );
                          setNotice(
                            `Выбрано предложение: ${candidate.productName}. Проверьте строки и сохраните черновик.`,
                          );
                        }}
                      >
                        Выбрать
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
      <form onSubmit={save}>
        <fieldset disabled={busy} style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
          <LineEditor
            lines={lines}
            onChange={setLines}
            prices
            disabled={busy}
            requestId={r.id}
            onPhotoBusy={setBusy}
            onPhotoError={setError}
          />
          <div className={s.fields} style={{ marginTop: 24 }}>
            <label className={s.field}>
              Доставка, сомони
              <input
                required
                inputMode="decimal"
                value={delivery}
                onChange={(e) => setDelivery(e.target.value)}
              />
            </label>
            <label className={s.field}>
              Действует до
              <input required name="validUntil" type="datetime-local" defaultValue={localDate} />
            </label>
            <label className={`${s.field} ${s.wide}`}>
              Условия и сроки поставки
              <textarea name="conditions" maxLength={5000} defaultValue={q?.conditions ?? ""} />
            </label>
          </div>
          <div className={s.actions}>
            <button className="button button-secondary" type="submit" value="draft">
              Сохранить черновик
            </button>
            <button className="button button-primary" type="submit" value="send">
              {busy ? "Сохраняем…" : "Отправить КП покупателю"}
            </button>
          </div>
          <p className={s.hint}>Отправка публикует актуальную версию КП в заявке покупателя.</p>
        </fieldset>
      </form>
      {notice && (
        <p className={s.success} role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      <details style={{ marginTop: 24 }}>
        <summary>Изменить статус заявки</summary>
        <label className={s.field}>
          Причина
          <textarea value={reason} maxLength={1000} onChange={(e) => setReason(e.target.value)} />
        </label>
        <div className={s.actions}>
          <button
            type="button"
            className="button button-secondary"
            disabled={busy || reason.trim().length < 3}
            onClick={() => void status("IN_REVIEW")}
          >
            Взять в работу
          </button>
          <button
            type="button"
            className="button button-secondary"
            disabled={busy || reason.trim().length < 3}
            onClick={() => void status("REJECTED")}
          >
            Отклонить заявку
          </button>
        </div>
      </details>
    </section>
  );
}

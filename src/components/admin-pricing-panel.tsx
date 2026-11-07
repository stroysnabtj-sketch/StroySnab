"use client";
import { useState } from "react";
import { DataTable, Input, Field } from "@/components/admin-ui";
import { calculateOrderMarkup } from "@/modules/pricing/order-markup";
import { toDirams, formatTJS } from "@/modules/system/money";
import styles from "@/components/workspace-design.module.css";
const tiers = [
  { range: "Менее 50 000 сомони", rate: 7 },
  { range: "От 50 000 до 100 000 сомони включительно", rate: 5 },
  { range: "Свыше 100 000 сомони", rate: 3 },
];
export function AdminPricingPanel() {
  const [base, setBase] = useState("50000");
  let quote: ReturnType<typeof calculateOrderMarkup> | null = null;
  try {
    quote = calculateOrderMarkup(toDirams(base));
  } catch {
    /* The input can be incomplete while typing. */
  }
  return (
    <div className={styles.detailGrid}>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Наценка платформы</h2>
        </div>
        <p className={styles.emptyText}>
          Одна ставка применяется к сумме материалов всего заказа до наценки. Доставка в пороги не
          входит.
        </p>
        <DataTable headers={["Сумма материалов", "Наценка"]}>
          {tiers.map((tier) => (
            <tr key={tier.rate}>
              <td>{tier.range}</td>
              <td>
                <strong>{tier.rate}%</strong>
              </td>
            </tr>
          ))}
        </DataTable>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Проверить расчёт</h2>
        </div>
        <Field label="Сумма материалов до наценки, TJS">
          <Input
            inputMode="decimal"
            value={base}
            onChange={(e) => setBase(e.target.value)}
            aria-describedby="pricing-help"
          />
        </Field>
        <p className={styles.subtle} id="pricing-help">
          Предварительный расчёт без стоимости доставки.
        </p>
        {quote ? (
          <dl className={styles.details}>
            <dt>Ставка</dt>
            <dd>
              <strong>{quote.percent}%</strong>
            </dd>
            <dt>Наценка</dt>
            <dd>{formatTJS(quote.markupDirams)}</dd>
            <dt>Итого</dt>
            <dd>
              <strong>{formatTJS(quote.totalDirams)}</strong>
            </dd>
          </dl>
        ) : (
          <p className={styles.alert} role="status">
            Введите сумму в сомони, не более двух знаков после запятой.
          </p>
        )}
      </section>
    </div>
  );
}

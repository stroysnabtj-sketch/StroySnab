"use client";
import { useState } from "react";
import Link from "next/link";
import { Input, Field } from "@/components/admin-ui";
import { productPrice } from "@/modules/pricing/product-price";
import { toDirams, formatTJS } from "@/modules/system/money";
import styles from "@/components/workspace-design.module.css";
export function AdminPricingPanel() {
  const [base, setBase] = useState("100"),
    [percent, setPercent] = useState("7");
  let total: bigint | null = null;
  try {
    total = productPrice(toDirams(base), percent.replace(",", "."));
  } catch {
    /* Incomplete input. */
  }
  return (
    <div className={styles.detailGrid}>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Наценка товара</h2>
        </div>
        <p className={styles.emptyText}>
          У каждого товара своя наценка. Изменить её можно в карточке товара в каталоге.
        </p>
        <Link className="button button-primary" href="/admin/catalog">
          Открыть товары
        </Link>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Проверить цену</h2>
        </div>
        <div className={styles.pricingFields}>
          <Field label="Закупочная цена за единицу, TJS">
            <Input inputMode="decimal" value={base} onChange={(e) => setBase(e.target.value)} />
          </Field>
          <Field label="Наценка, %">
            <Input
              inputMode="decimal"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
            />
          </Field>
        </div>
        {total !== null ? (
          <dl className={styles.details}>
            <dt>Цена продажи</dt>
            <dd>
              <strong>{formatTJS(total)}</strong>
            </dd>
          </dl>
        ) : (
          <p role="status">Проверьте цену и наценку.</p>
        )}
      </section>
    </div>
  );
}

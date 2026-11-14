import { sql } from "drizzle-orm";
import type { AppDatabase } from "@/db";
export const integrityChecks: Record<string, string> = {
  order_total:
    "select id::text from orders where total_dirams::numeric<>materials_total_dirams::numeric+delivery_total_dirams::numeric",
  order_line_sum:
    "select o.id::text from orders o left join order_items i on i.order_id=o.id group by o.id having o.materials_total_dirams::numeric<>coalesce(sum(i.subtotal_dirams::numeric),0)",
  order_base_markup:
    "select id::text from orders where goods_base_dirams is not null and markup_dirams is not null and goods_base_dirams::numeric+markup_dirams::numeric<>materials_total_dirams::numeric",
  order_line_arithmetic:
    "select i.id::text from order_items i join orders o on o.id=i.order_id where o.markup_percent=0 and i.subtotal_dirams::numeric<>floor(i.price_dirams::numeric*i.qty)",
  quote_total:
    "select id::text from quotations where total_dirams::numeric<>base_dirams::numeric+markup_dirams::numeric+delivery_dirams::numeric",
  quote_line_sum:
    "select q.id::text from quotations q where q.total_dirams::numeric-q.delivery_dirams::numeric<>coalesce((select sum((l->>'subtotalDirams')::numeric) from jsonb_array_elements(q.lines) l),0)",
  payment_balance:
    "select o.id::text from orders o join order_payments p on p.order_id=o.id group by o.id having sum(case when p.kind='PAYMENT' then p.amount_dirams::numeric else -p.amount_dirams::numeric end)<0 or sum(case when p.kind='PAYMENT' then p.amount_dirams::numeric else -p.amount_dirams::numeric end)>o.total_dirams::numeric",
  stock_bounds:
    "select id::text from supplier_offers where stock_qty::numeric<0 or reserved_qty::numeric<0 or reserved_qty::numeric>stock_qty::numeric",
  reservation_sum:
    "select f.id::text from supplier_offers f left join (select i.offer_id,sum(i.qty) qty from order_items i join orders o on o.id=i.order_id where o.status not in ('CANCELLED','DELIVERED') and i.offer_id is not null group by i.offer_id) r on r.offer_id=f.id where f.reserved_qty::numeric<>coalesce(r.qty,0)",
  price_history_protection:
    "select 'price_history_triggers'::text id where (select count(*) from pg_trigger where not tgisinternal and tgenabled='O' and tgname in ('supplier_offers_price_history','products_price_history','pricing_rules_price_history','price_history_protect_rows','price_history_protect_truncate'))<>5",
};
/** Reads a consistent snapshot; never repairs or migrates production data. */
export async function auditData(db: AppDatabase) {
  return db.transaction(
    async (tx) => {
      const checks = [];
      for (const [name, query] of Object.entries(integrityChecks)) {
        const result = await tx.execute<{ count: string; sample: string[] }>(
          sql.raw(
            `select count(*)::text as count, (array_agg(id))[1:10] as sample from (${query}) findings`,
          ),
        );
        checks.push({
          name,
          count: Number(result.rows[0].count),
          sample: result.rows[0].sample ?? [],
        });
      }
      return {
        ok: checks.every((c) => c.count === 0),
        checkedAt: new Date().toISOString(),
        checks,
      };
    },
    { isolationLevel: "repeatable read", accessMode: "read only" },
  );
}

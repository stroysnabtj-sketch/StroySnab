import Link from "next/link";
import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import { Workspace } from "@/components/workspace";
import { DataTable, Badge } from "@/components/admin-ui";
import { requirePagePermission } from "@/modules/auth/page";
import { getDb } from "@/db";
import { PAYMENT_LABELS } from "@/modules/orders/payment-service";
import { orders, orderPayments } from "@/db/schema";
import { formatTJS } from "@/modules/system/money";
import { formatDateTime } from "@/i18n";
import { ORDER_STATUS_LABELS } from "@/modules/orders/status";
import styles from "@/components/workspace-design.module.css";
export const dynamic = "force-dynamic";
export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; payment?: string; page?: string }>;
}) {
  await requirePagePermission("orders:read", "/admin/orders");
  const db = await getDb();
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 200),
    status = params.status && ORDER_STATUS_LABELS[params.status] ? params.status : "";
  const payment = params.payment && PAYMENT_LABELS[params.payment] ? params.payment : "";
  const totals = db
    .select({
      orderId: orderPayments.orderId,
      paid: sql<string>`sum(case when ${orderPayments.kind} = 'PAYMENT' then ${orderPayments.amountDirams}::numeric else -${orderPayments.amountDirams}::numeric end)`.as(
        "paid",
      ),
      refunded:
        sql<string>`sum(case when ${orderPayments.kind} = 'REFUND' then ${orderPayments.amountDirams}::numeric else 0 end)`.as(
          "refunded",
        ),
    })
    .from(orderPayments)
    .groupBy(orderPayments.orderId)
    .as("payment_totals");
  const netPaid = sql<string>`coalesce(${totals.paid}, 0)`;
  const paymentStatus = sql<string>`case when ${netPaid} = 0 then case when coalesce(${totals.refunded}, 0) > 0 then 'REFUNDED' else 'UNPAID' end when ${netPaid} >= ${orders.totalDirams}::numeric then 'PAID' else 'PARTIAL' end`;
  const conditions = [];
  if (q)
    conditions.push(
      or(
        ilike(orders.orderNumber, `%${q}%`),
        ilike(orders.customerName, `%${q}%`),
        ilike(orders.customerPhone, `%${q}%`),
      ),
    );
  if (status) conditions.push(eq(orders.status, status));
  if (payment) conditions.push(sql`${paymentStatus} = ${payment}`);
  const where = conditions.length ? and(...conditions) : undefined;
  const [[total], counts] = await Promise.all([
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(orders)
      .leftJoin(totals, eq(totals.orderId, orders.id))
      .where(where),
    db
      .select({ status: orders.status, value: sql<number>`count(*)::int` })
      .from(orders)
      .groupBy(orders.status),
  ]);
  const pages = Math.max(1, Math.ceil(total.value / 20));
  const requested = Number(params.page ?? 1);
  const page = Number.isSafeInteger(requested) ? Math.min(pages, Math.max(1, requested)) : 1;
  const rows = await db
    .select({
      ...getTableColumns(orders),
      paymentStatus,
      paidDirams: sql<string>`${netPaid}::text`,
      balanceDirams: sql<string>`(${orders.totalDirams}::numeric - ${netPaid})::text`,
    })
    .from(orders)
    .leftJoin(totals, eq(totals.orderId, orders.id))
    .where(where)
    .orderBy(desc(orders.createdAt), desc(orders.id))
    .limit(20)
    .offset((page - 1) * 20);
  const href = (next: { status?: string; page?: number }) =>
    `/admin/orders?${new URLSearchParams({ ...(q ? { q } : {}), ...(payment ? { payment } : {}), ...((next.status ?? status) ? { status: next.status ?? status } : {}), ...(next.page ? { page: String(next.page) } : {}) })}`;
  return (
    <Workspace kind="admin">
      <header className={styles.pageHeading}>
        <div>
          <h1>Заказы</h1>
          <p>Подтверждение, получение и история выполнения заказов.</p>
        </div>
        <span className={styles.headingMeta}>Найдено: {total.value}</span>
      </header>
      <nav className={styles.statusTabs} aria-label="Статусы заказов">
        <Link href={href({ status: "" })} aria-current={!status ? "page" : undefined}>
          Все <small>{counts.reduce((sum, row) => sum + row.value, 0)}</small>
        </Link>
        {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
          <Link
            key={key}
            href={href({ status: key })}
            aria-current={status === key ? "page" : undefined}
          >
            {label}
            <small>{counts.find((row) => row.status === key)?.value ?? 0}</small>
          </Link>
        ))}
      </nav>
      <form className={styles.filterForm}>
        <input
          className="input"
          name="q"
          defaultValue={q}
          aria-label="Поиск заказов"
          placeholder="Номер заказа, получатель или телефон"
        />
        <select name="payment" className="input" defaultValue={payment} aria-label="Статус оплаты">
          <option value="">Любая оплата</option>
          {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {status && <input type="hidden" name="status" value={status} />}
        <button className="button button-primary">Найти</button>
        {q && (
          <Link
            className="button button-secondary"
            href={`/admin/orders?${new URLSearchParams({ ...(status ? { status } : {}), ...(payment ? { payment } : {}) })}`}
          >
            Сбросить поиск
          </Link>
        )}
      </form>
      <DataTable headers={["Заказ", "Получатель", "Сумма", "Оплата", "Статус", "Действие"]}>
        {rows.map((order) => (
          <tr key={order.id}>
            <td>
              <Link className="inline-link" href={`/admin/orders/${order.id}`}>
                <strong>{order.orderNumber}</strong>
              </Link>
              <br />
              <small className="muted">{formatDateTime(order.createdAt)}</small>
            </td>
            <td>
              {order.customerName}
              <br />
              <a className="muted" href={`tel:${order.customerPhone}`}>
                {order.customerPhone}
              </a>
            </td>
            <td>
              <strong>{formatTJS(order.totalDirams)}</strong>
            </td>
            <td>
              <Badge tone={order.paymentStatus === "PAID" ? "success" : "warning"}>
                {PAYMENT_LABELS[order.paymentStatus]}
              </Badge>
              <br />
              <small className="muted">Получено: {formatTJS(order.paidDirams)}</small>
              <br />
              <small className="muted">Остаток: {formatTJS(order.balanceDirams)}</small>
            </td>
            <td>
              <Badge
                tone={
                  order.status === "NEW"
                    ? "warning"
                    : order.status === "DELIVERED"
                      ? "success"
                      : order.status === "CANCELLED"
                        ? "danger"
                        : "info"
                }
              >
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
            </td>
            <td>
              <Link className="button button-secondary" href={`/admin/orders/${order.id}`}>
                Открыть заказ
              </Link>
            </td>
          </tr>
        ))}
      </DataTable>
      {!rows.length && (
        <div className={styles.resourceState}>
          <strong>{q || status || payment ? "Заказы не найдены" : "Заказов пока нет"}</strong>
          <p>
            {q || status || payment
              ? "Измените условия поиска."
              : "Здесь появятся заказы покупателей."}
          </p>
        </div>
      )}
      <div className="pagination">
        {page > 1 ? (
          <Link className="button button-secondary" href={href({ page: page - 1 })}>
            Назад
          </Link>
        ) : (
          <span />
        )}
        <span>
          {page} / {pages}
        </span>
        {page < pages ? (
          <Link className="button button-secondary" href={href({ page: page + 1 })}>
            Далее
          </Link>
        ) : (
          <span />
        )}
      </div>
    </Workspace>
  );
}

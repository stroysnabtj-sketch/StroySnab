import { getTranslator } from "@/i18n/server";
import { CustomerWorkspace } from "@/components/customer-workspace";
import { PrintButton } from "@/components/print-button";
import { ReorderButton } from "@/components/reorder-button";
import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { ArrowUpRight, ShoppingBag, Truck, CalendarDays } from "lucide-react";
import { requirePageUser } from "@/modules/auth/page";
import { getDb } from "@/db";
import { orders, orderItems, orderPayments, customers } from "@/db/schema";
import { formatTJS } from "@/modules/system/money";
import { formatDateTime } from "@/i18n";
import styles from "@/components/account.module.css";
export const dynamic = "force-dynamic";
export const metadata = { title: "Мои заказы — Stroysnab.tj" };
const statuses: Record<string, string> = {
  NEW: "Ожидает подтверждения",
  CONFIRMED: "Подтверждён",
  DISPATCHED: "Передан в доставку",
  DELIVERED: "Получен",
  CANCELLED: "Отменён",
};
const paymentLabels: Record<string, string> = {
  UNPAID: "Не оплачен",
  PARTIAL: "Частично оплачен",
  PAID: "Оплачен",
  REFUNDED: "Возврат оплаты",
};

type OrderTab = "all" | "active" | "unpaid" | "done";

export default async function AccountOrders({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const tr = await getTranslator();
  const user = await requirePageUser(["CUSTOMER"], "/account/orders");
  const params = await searchParams;
  const tab: OrderTab =
    params.tab === "active" || params.tab === "unpaid" || params.tab === "done"
      ? params.tab
      : "all";
  const db = await getDb();
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.userId, user.id))
    .limit(1);
  const items = customer
    ? await db
        .select()
        .from(orders)
        .where(eq(orders.customerId, customer.id))
        .orderBy(desc(orders.createdAt))
        .limit(100)
    : [];
  const orderIds = items.map((order) => order.id);
  const [paymentRows, itemRows] = orderIds.length
    ? await Promise.all([
        db
          .select({
            orderId: orderPayments.orderId,
            kind: orderPayments.kind,
            amountDirams: orderPayments.amountDirams,
          })
          .from(orderPayments)
          .where(inArray(orderPayments.orderId, orderIds)),
        db
          .select({
            orderId: orderItems.orderId,
            offerId: orderItems.offerId,
            qty: orderItems.qty,
          })
          .from(orderItems)
          .where(inArray(orderItems.orderId, orderIds)),
      ])
    : [[], []];

  const paymentTotalsByOrder = new Map<string, { paid: bigint; refund: bigint }>();
  for (const row of paymentRows) {
    const entry = paymentTotalsByOrder.get(row.orderId) ?? { paid: 0n, refund: 0n };
    if (row.kind === "PAYMENT") entry.paid += BigInt(row.amountDirams);
    else entry.refund += BigInt(row.amountDirams);
    paymentTotalsByOrder.set(row.orderId, entry);
  }

  const orderLinesByOrder = new Map<string, Array<{ offerId: string | null; qty: string }>>();
  for (const row of itemRows) {
    const list = orderLinesByOrder.get(row.orderId) ?? [];
    list.push({ offerId: row.offerId, qty: row.qty });
    orderLinesByOrder.set(row.orderId, list);
  }

  const enriched = items.map((order) => {
    const totals = paymentTotalsByOrder.get(order.id) ?? { paid: 0n, refund: 0n };
    const net = totals.paid - totals.refund;
    const total = BigInt(order.totalDirams);
    const status =
      net === 0n ? (totals.refund > 0n ? "REFUNDED" : "UNPAID") : net >= total ? "PAID" : "PARTIAL";
    return {
      order,
      payment: {
        status,
        paidDirams: net.toString(),
        totalDirams: total.toString(),
        balanceDirams: (total - net).toString(),
      },
      reorderItems: orderLinesByOrder.get(order.id) ?? [],
    };
  });

  const matchesTab = (entry: (typeof enriched)[number], target: OrderTab) => {
    if (target === "active") return !["DELIVERED", "CANCELLED"].includes(entry.order.status);
    if (target === "unpaid")
      return entry.order.status !== "CANCELLED" && BigInt(entry.payment.balanceDirams) > 0n;
    if (target === "done") return ["DELIVERED", "CANCELLED"].includes(entry.order.status);
    return true;
  };
  const filtered = enriched.filter((entry) => matchesTab(entry, tab));
  const tabs: Array<{ key: OrderTab; label: string; count: number }> = [
    { key: "all", label: tr("Все"), count: enriched.length },
    {
      key: "active",
      label: tr("В работе"),
      count: enriched.filter((e) => matchesTab(e, "active")).length,
    },
    {
      key: "unpaid",
      label: tr("Неоплаченные"),
      count: enriched.filter((e) => matchesTab(e, "unpaid")).length,
    },
    {
      key: "done",
      label: tr("Завершённые"),
      count: enriched.filter((e) => matchesTab(e, "done")).length,
    },
  ];

  return (
    <CustomerWorkspace
      title={tr("Заказы")}
      identity={user.phone}
      actions={
        <Link href="/catalog" className="button button-secondary">
          {tr("В каталог")}
        </Link>
      }
    >
      {items.length > 0 && (
        <nav className={styles.orderTabs} aria-label={tr("Фильтр заказов")}>
          {tabs.map((item) => (
            <Link
              key={item.key}
              href={item.key === "all" ? "/account/orders" : `/account/orders?tab=${item.key}`}
              className={styles.orderTab}
              aria-current={tab === item.key ? "page" : undefined}
            >
              <span>{item.label}</span>
              <small>{item.count}</small>
            </Link>
          ))}
        </nav>
      )}
      <section className={styles.orderList} aria-label="История заказов">
        {filtered.length ? (
          filtered.map(({ order, payment, reorderItems }) => (
            <article className={styles.orderCard} key={order.id}>
              <div className={styles.orderTop}>
                <div>
                  <span className={styles.orderDate}>
                    <CalendarDays size={14} aria-hidden="true" />
                    {formatDateTime(order.createdAt)}
                  </span>
                  <h2>
                    <Link href={`/orders/${order.id}`}>
                      {order.orderNumber}
                      <ArrowUpRight size={20} aria-hidden="true" />
                    </Link>
                  </h2>
                </div>
                <span
                  className={`${styles.status} ${order.status === "DELIVERED" ? styles.success : ""}`}
                >
                  {tr(statuses[order.status] ?? order.status)}
                </span>
              </div>
              <div className={styles.orderBody}>
                <div className={styles.delivery}>
                  <Truck size={19} aria-hidden="true" />
                  <div>
                    <strong>{order.vehicleType === "PICKUP" ? tr("Самовывоз") : tr("Доставка")}</strong>
                    <p>
                      {[order.deliveryCity, order.deliveryAddress].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
                <dl className={styles.amounts}>
                  <div>
                    <dt>{tr("Сумма заказа")}</dt>
                    <dd>{formatTJS(payment.totalDirams)}</dd>
                  </div>
                  <div>
                    <dt>{tr("Оплачено")}</dt>
                    <dd>{formatTJS(payment.paidDirams)}</dd>
                  </div>
                  <div>
                    <dt>{tr("Остаток")}</dt>
                    <dd>{formatTJS(payment.balanceDirams)}</dd>
                  </div>
                </dl>
              </div>
              <footer className={styles.orderFooter}>
                <span
                  className={`${styles.payment} ${payment.status === "PAID" ? styles.paymentPaid : ""}`}
                >
                  {tr(paymentLabels[payment.status])}
                </span>
                <div className={styles.orderActions}>
                  <ReorderButton items={reorderItems} />
                  <PrintButton orderId={order.id} />
                  <Link href={`/orders/${order.id}`} className={styles.textLink}>
                    {tr("Открыть заказ")}
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </footer>
            </article>
          ))
        ) : items.length > 0 ? (
          <div className={`${styles.panel} ${styles.empty}`}>
            <ShoppingBag size={36} aria-hidden="true" />
            <h2>{tr("В этом разделе заказов нет")}</h2>
            <p>{tr("Выберите другую вкладку или откройте все заказы.")}</p>
            <div className={styles.emptyActions}>
              <Link href="/account/orders" className="button button-secondary">
                {tr("Показать все")}
              </Link>
            </div>
          </div>
        ) : (
          <div className={`${styles.panel} ${styles.empty}`}>
            <ShoppingBag size={38} aria-hidden="true" />
            <h2>{tr("Заказов пока нет")}</h2>
            <p>{tr("Выберите материалы в каталоге или отправьте заявку на закупку.")}</p>
            <div className={styles.emptyActions}>
              <Link href="/catalog" className="button button-primary">
                {tr("Перейти в каталог")}
              </Link>
              <Link href="/account/requests" className="button button-secondary">
                {tr("Заявки")}
              </Link>
            </div>
          </div>
        )}
      </section>
      {items.length === 100 && <p className={styles.footnote}>{tr("Показаны последние 100 заказов.")}</p>}
    </CustomerWorkspace>
  );
}

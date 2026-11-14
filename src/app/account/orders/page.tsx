import { getTranslator } from "@/i18n/server";
import { CustomerWorkspace } from "@/components/customer-workspace";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ArrowUpRight, ShoppingBag, Truck, CalendarDays } from "lucide-react";
import { requirePageUser } from "@/modules/auth/page";
import { getDb } from "@/db";
import { orders, customers } from "@/db/schema";
import { getOrderPaymentSummary } from "@/modules/orders/payment-service";
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

export default async function AccountOrders() {
  const tr = await getTranslator();
  const user = await requirePageUser(["CUSTOMER"], "/account/orders");
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
  const payments = await Promise.all(items.map((order) => getOrderPaymentSummary(order.id)));
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
      <section className={styles.orderList} aria-label="История заказов">
        {items.length ? (
          items.map((order, index) => {
            const payment = payments[index];
            return (
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
                    {statuses[order.status] ?? order.status}
                  </span>
                </div>
                <div className={styles.orderBody}>
                  <div className={styles.delivery}>
                    <Truck size={19} aria-hidden="true" />
                    <div>
                      <strong>Доставка</strong>
                      <p>
                        {order.deliveryCity}, {order.deliveryAddress}
                      </p>
                    </div>
                  </div>
                  <dl className={styles.amounts}>
                    <div>
                      <dt>{tr("Сумма заказа")}</dt>
                      <dd>{formatTJS(payment.totalDirams)}</dd>
                    </div>
                    <div>
                      <dt>Оплачено</dt>
                      <dd>{formatTJS(payment.paidDirams)}</dd>
                    </div>
                    <div>
                      <dt>Остаток</dt>
                      <dd>{formatTJS(payment.balanceDirams)}</dd>
                    </div>
                  </dl>
                </div>
                <footer className={styles.orderFooter}>
                  <span
                    className={`${styles.payment} ${payment.status === "PAID" ? styles.paymentPaid : ""}`}
                  >
                    {paymentLabels[payment.status]}
                  </span>
                  <Link href={`/orders/${order.id}`} className={styles.textLink}>
                    Открыть заказ
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                </footer>
              </article>
            );
          })
        ) : (
          <div className={`${styles.panel} ${styles.empty}`}>
            <ShoppingBag size={38} aria-hidden="true" />
            <h2>Заказов пока нет</h2>
            <p>Выберите материалы в каталоге или отправьте заявку на закупку.</p>
            <div className={styles.emptyActions}>
              <Link href="/catalog" className="button button-primary">
                Перейти в каталог
              </Link>
              <Link href="/account/requests" className="button button-secondary">
                {tr("Заявки")}
              </Link>
            </div>
          </div>
        )}
      </section>
      {items.length === 100 && <p className={styles.footnote}>Показаны последние 100 заказов.</p>}
    </CustomerWorkspace>
  );
}

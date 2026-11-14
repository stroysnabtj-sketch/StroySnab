import { getTranslator } from "@/i18n/server";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { getDb } from "@/db";
import { customers, orders } from "@/db/schema";
import { requirePageUser } from "@/modules/auth/page";
import { customerRequestRows } from "./requests/data";
import { CustomerRequestList } from "@/components/customer-request-list";
import { CustomerWorkspace } from "@/components/customer-workspace";
import { formatTJS } from "@/modules/system/money";
import { formatDateTime } from "@/i18n";
import styles from "@/components/account.module.css";
export const dynamic = "force-dynamic";
export const metadata = { title: "Личный кабинет — Stroysnab.tj" };
const statuses: Record<string, string> = {
  NEW: "Ожидает подтверждения",
  CONFIRMED: "Подтверждён",
  DISPATCHED: "В доставке",
  DELIVERED: "Получен",
  CANCELLED: "Отменён",
};

export default async function AccountPage() {
  const tr = await getTranslator();
  const user = await requirePageUser(["CUSTOMER"], "/account");
  const db = await getDb();
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.userId, user.id))
    .limit(1);
  const [items, requests] = await Promise.all([
    customer
      ? db
          .select({
            id: orders.id,
            orderNumber: orders.orderNumber,
            status: orders.status,
            totalDirams: orders.totalDirams,
            createdAt: orders.createdAt,
          })
          .from(orders)
          .where(eq(orders.customerId, customer.id))
          .orderBy(desc(orders.createdAt))
      : Promise.resolve([]),
    customerRequestRows(user),
  ]);
  const activeOrders = items.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status));
  const offers = requests.filter((request) => request.group === "offered");
  return (
    <CustomerWorkspace
      title={tr("Обзор")}
      identity={customer?.fullName || user.phone}
      actions={
        <Link href="/request" className="button button-primary">
          {tr("Создать заявку")}
        </Link>
      }
    >
      <div className={styles.overviewColumns}>
        <section className={styles.panel}>
          <div className={styles.sectionHead}>
            <h2>{tr("Активные заказы")}</h2>
            <Link href="/account/orders">
              {tr("Все заказы")}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          {activeOrders.length ? (
            <div>
              {activeOrders.slice(0, 4).map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`} className={styles.recentOrder}>
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <span>{formatDateTime(order.createdAt)}</span>
                  </div>
                  <div>
                    <strong>{formatTJS(order.totalDirams)}</strong>
                    <span>{statuses[order.status] ?? order.status}</span>
                  </div>
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <ShoppingBag size={32} aria-hidden="true" />
              <h3>{tr("Активных заказов нет")}</h3>
              <Link href="/catalog" className="button button-primary">
                {tr("Открыть каталог")}
              </Link>
            </div>
          )}
        </section>
        <section className={styles.panel}>
          <div className={styles.sectionHead}>
            <h2>{tr("Новые предложения")}</h2>
            <Link href="/account/requests?status=offered">
              Все <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <CustomerRequestList items={offers.slice(0, 4)} />
        </section>
      </div>
    </CustomerWorkspace>
  );
}

import Link from "next/link";
import { WorkspaceRefresh } from "@/components/workspace-refresh";
import { Workspace } from "@/components/workspace";
import { requirePageUser } from "@/modules/auth/page";
import { listShopOrders } from "@/modules/suppliers/shop-service";
import { SHOP_ORDER_STATUS_LABELS } from "@/modules/suppliers/order-status";
import { ORDER_STATUS_LABELS } from "@/modules/orders/status";
import { formatDateTime } from "@/i18n";
import styles from "@/components/seller-workspace.module.css";
export const dynamic = "force-dynamic";
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const actor = await requirePageUser(["SUPPLIER_OWNER", "SUPPLIER_STAFF"], "/seller/orders");
  const params = await searchParams,
    q = (params.q ?? "").trim(),
    status = params.status ?? "";
  const all = await listShopOrders(actor);
  const filtered = all.filter(
    (row) =>
      (!status || row.status === status) &&
      (!q ||
        `${row.orderNumber} ${row.customerName} ${row.customerPhone}`
          .toLocaleLowerCase("ru")
          .includes(q.toLocaleLowerCase("ru"))),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 20));
  const requested = Number(params.page ?? 1);
  const page = Number.isSafeInteger(requested) ? Math.min(pages, Math.max(1, requested)) : 1;
  const href = (n: number) =>
    `/seller/orders?${new URLSearchParams({ q, status, page: String(n) })}`;
  return (
    <Workspace kind="seller">
      <div className={styles.root}>
        <div className={styles.heading}>
          <div>
            <h1>Заказы магазина</h1>
            <p>Только ваши позиции. Найдено заказов: {filtered.length}.</p>
          </div>
          <WorkspaceRefresh />
        </div>
        <form className={styles.actions}>
          <label className={styles.field} style={{ flex: 1 }}>
            Поиск
            <input name="q" defaultValue={q} placeholder="Номер, получатель или телефон" />
          </label>
          <label className={styles.field}>
            Статус
            <select name="status" defaultValue={status}>
              <option value="">Все статусы</option>
              {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button className={styles.button}>Найти</button>
        </form>
        <section className={styles.panel}>
          {filtered.slice((page - 1) * 20, page * 20).map((order) => (
            <div className={styles.row} key={order.id}>
              <div>
                <Link className={styles.link} href={`/seller/orders/${order.id}`}>
                  {order.orderNumber}
                </Link>
                <small>{formatDateTime(order.createdAt)}</small>
              </div>
              <div>
                {order.customerName}
                <small>{order.deliveryCity}</small>
              </div>
              <span className={styles.badge}>
                {SHOP_ORDER_STATUS_LABELS[order.shopStatus] ?? order.shopStatus}
              </span>
              <Link className={styles.link} href={`/seller/orders/${order.id}`}>
                Открыть · {order.items.length} поз.
              </Link>
            </div>
          ))}
          {!filtered.length && (
            <p className={styles.empty}>
              {q || status
                ? "Заказы по выбранным условиям не найдены."
                : "Заказов пока нет. Здесь появятся товары вашего магазина из оформленных заказов."}
            </p>
          )}
        </section>
        {pages > 1 && (
          <nav className={styles.actions} aria-label="Страницы заказов">
            {page > 1 && (
              <Link className={`${styles.button} ${styles.secondary}`} href={href(page - 1)}>
                Назад
              </Link>
            )}
            <span>
              {page} / {pages}
            </span>
            {page < pages && (
              <Link className={styles.button} href={href(page + 1)}>
                Далее
              </Link>
            )}
          </nav>
        )}
      </div>
    </Workspace>
  );
}

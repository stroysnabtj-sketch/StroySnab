import Link from "next/link";
import { Package, ShoppingBag, ClipboardCheck, PackageX, ArrowRight } from "lucide-react";
import { WorkspaceRefresh } from "@/components/workspace-refresh";
import { Workspace } from "@/components/workspace";
import { requirePageUser } from "@/modules/auth/page";
import { listShopOrders, listShopProducts, shopMembership } from "@/modules/suppliers/shop-service";
import { ORDER_STATUS_LABELS } from "@/modules/orders/status";
import { PRODUCT_STATUS_LABELS } from "@/modules/system/admin-labels";
import styles from "@/components/workspace-design.module.css";
export const dynamic = "force-dynamic";
export default async function SellerPage() {
  const actor = await requirePageUser(["SUPPLIER_OWNER", "SUPPLIER_STAFF"], "/seller");
  const [{ supplier }, products, orders] = await Promise.all([
    shopMembership(actor),
    listShopProducts(actor),
    listShopOrders(actor),
  ]);
  const pending = products.filter((row) => row.product.status === "PENDING");
  const metrics = [
    {
      label: "Товаров в ассортименте",
      value: products.length,
      href: "/seller/products",
      icon: Package,
      note: "Карточки и условия продажи",
    },
    {
      label: "На модерации",
      value: pending.length,
      href: "/seller/products?status=PENDING",
      icon: ClipboardCheck,
      note: "Ожидают проверки платформой",
    },
    {
      label: "Заказы в работе",
      value: orders.filter((row) => !["DELIVERED", "CANCELLED"].includes(row.status)).length,
      href: "/seller/orders",
      icon: ShoppingBag,
      note: "Только позиции вашего магазина",
    },
    {
      label: "Без свободного остатка",
      value: products.filter(
        (row) => !row.offer || Number(row.offer.stockQty) <= Number(row.offer.reservedQty),
      ).length,
      href: "/seller/products",
      icon: PackageX,
      note: "Проверьте остатки и резерв",
    },
  ];
  return (
    <Workspace kind="seller">
      <header className={styles.pageHeading}>
        <div>
          <h1>{supplier.name}</h1>
          <p>Ассортимент, остатки и заказы вашего магазина.</p>
        </div>
        <WorkspaceRefresh />
        {supplier.status !== "SUSPENDED" && (
          <Link className="button button-primary" href="/seller/products/new">
            Добавить товар
          </Link>
        )}
      </header>
      {supplier.status !== "ACTIVE" && (
        <p className={styles.alert}>
          {supplier.status === "SUSPENDED"
            ? "Магазин приостановлен. Для возобновления работы свяжитесь с платформой."
            : "Магазин ожидает подключения. Предложения появятся в продаже после активации платформой."}
        </p>
      )}
      <div className={styles.metrics}>
        {metrics.map((row) => (
          <Link className={styles.metric} key={row.label} href={row.href}>
            <div className={styles.metricTop}>
              <span>{row.label}</span>
              <row.icon size={19} />
            </div>
            <strong>{row.value}</strong>
            <small>{row.note}</small>
          </Link>
        ))}
      </div>
      <div className={styles.dashboardGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Последние заказы</h2>
            <Link href="/seller/orders">Все заказы →</Link>
          </div>
          {orders.slice(0, 5).map((order) => (
            <Link className={styles.queueRow} href={`/seller/orders/${order.id}`} key={order.id}>
              <div>
                <strong>{order.orderNumber}</strong>
                <small>
                  {order.customerName} · {order.items.length} поз.
                </small>
              </div>
              <small>{ORDER_STATUS_LABELS[order.status] ?? order.status}</small>
            </Link>
          ))}
          {!orders.length && (
            <p className={styles.emptyText}>Здесь появятся ваши позиции из заказов покупателей.</p>
          )}
        </section>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Последние изменения</h2>
            <Link href="/seller/products">Ассортимент →</Link>
          </div>
          {products.slice(0, 5).map((row) => (
            <Link
              className={styles.queueRow}
              href={`/seller/products/${row.product.id}`}
              key={row.product.id}
            >
              <div>
                <strong>{row.product.nameRu}</strong>
                <small>{PRODUCT_STATUS_LABELS[row.product.status] ?? row.product.status}</small>
              </div>
              <ArrowRight size={16} />
            </Link>
          ))}
          {!products.length && (
            <p className={styles.emptyText}>
              Добавьте первую карточку и заполните условия продажи. После проверки платформой товар
              появится в каталоге.
            </p>
          )}
        </section>
      </div>
    </Workspace>
  );
}

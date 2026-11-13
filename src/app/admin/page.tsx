import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import {
  ArrowRight,
  Package,
  Store,
  ClipboardList,
  ShoppingBag,
  Truck,
  FolderTree,
  Users,
  History,
} from "lucide-react";
import { Workspace } from "@/components/workspace";
import { requirePageUser } from "@/modules/auth/page";
import { ROLES, hasPermission } from "@/modules/rbac/permissions";
import { getDb } from "@/db";
import { orders, products, suppliers, productRequests } from "@/db/schema";
import { formatTJS } from "@/modules/system/money";
import { ORDER_STATUS_LABELS } from "@/modules/orders/status";
import styles from "@/components/workspace-design.module.css";
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const actor = await requirePageUser(
    ROLES.filter((r) => !["GUEST", "CUSTOMER", "SUPPLIER_OWNER", "SUPPLIER_STAFF"].includes(r)),
    "/admin",
  );
  const db = await getDb();
  const can = (permission: Parameters<typeof hasPermission>[1]) =>
    hasPermission(actor.role, permission);
  const [orderStats, productStats, shopStats, requestStats, recent, pending] = await Promise.all([
    can("orders:read")
      ? db
          .select({
            value: sql<number>`count(*) filter(where status not in ('CANCELLED','DELIVERED'))::int`,
            newCount: sql<number>`count(*) filter(where status='NEW')::int`,
          })
          .from(orders)
      : Promise.resolve([]),
    can("catalog:manage")
      ? db
          .select({
            value: sql<number>`count(*) filter(where status='PENDING')::int`,
            total: sql<number>`count(*)::int`,
          })
          .from(products)
      : Promise.resolve([]),
    can("suppliers:manage")
      ? db
          .select({
            value: sql<number>`count(*) filter(where status='ACTIVE')::int`,
            pending: sql<number>`count(*) filter(where status='PENDING')::int`,
          })
          .from(suppliers)
      : Promise.resolve([]),
    can("product_requests:manage")
      ? db
          .select({ value: sql<number>`count(*) filter(where status='NEW')::int` })
          .from(productRequests)
      : Promise.resolve([]),
    can("orders:read")
      ? db
          .select({
            id: orders.id,
            orderNumber: orders.orderNumber,
            customerName: orders.customerName,
            status: orders.status,
            totalDirams: orders.totalDirams,
          })
          .from(orders)
          .orderBy(desc(orders.createdAt))
          .limit(5)
      : Promise.resolve([]),
    can("catalog:manage")
      ? db
          .select({ id: products.id, name: products.nameRu, sku: products.sku })
          .from(products)
          .where(eq(products.status, "PENDING"))
          .orderBy(desc(products.updatedAt))
          .limit(5)
      : Promise.resolve([]),
  ]);
  const [deliveryCount] =
    can("deliveries:manage") && !can("orders:read")
      ? await db
          .select({ value: sql<number>`count(*)::int` })
          .from(orders)
          .where(sql`vehicle_type != 'PICKUP' and status not in ('DELIVERED','CANCELLED')`)
      : [];
  const cards = [
    ...(deliveryCount
      ? [
          {
            href: "/admin/deliveries",
            label: "Доставки в работе",
            value: deliveryCount.value,
            note: "Транспорт и назначение водителей",
            icon: Truck,
            attention: false,
          },
        ]
      : []),
    ...(orderStats[0]
      ? [
          {
            href: "/admin/orders",
            label: "Заказы в работе",
            value: orderStats[0].value,
            note: `${orderStats[0].newCount} ожидают подтверждения`,
            icon: ShoppingBag,
            attention: orderStats[0].newCount > 0,
          },
        ]
      : []),
    ...(productStats[0]
      ? [
          {
            href: "/admin/catalog?status=PENDING",
            label: "Товары на модерации",
            value: productStats[0].value,
            note: `Всего в каталоге: ${productStats[0].total}`,
            icon: Package,
            attention: productStats[0].value > 0,
          },
        ]
      : []),
    ...(shopStats[0]
      ? [
          {
            href: "/admin/suppliers",
            label: "Активные магазины",
            value: shopStats[0].value,
            note: `${shopStats[0].pending} ожидают подключения`,
            icon: Store,
            attention: false,
          },
        ]
      : []),
    ...(requestStats[0]
      ? [
          {
            href: "/admin/product-requests?status=NEW",
            label: "Новые заявки",
            value: requestStats[0].value,
            note: "Запросы покупателей на материалы",
            icon: ClipboardList,
            attention: requestStats[0].value > 0,
          },
        ]
      : []),
  ];
  const shortcuts = [
    {
      href: "/admin/deliveries",
      label: "Очередь доставок",
      permission: "deliveries:manage" as const,
      icon: Truck,
    },
    {
      href: "/admin/categories",
      label: "Категории и характеристики",
      permission: "catalog:manage" as const,
      icon: FolderTree,
    },
    {
      href: "/admin/users",
      label: "Пользователи и доступы",
      permission: "users:manage" as const,
      icon: Users,
    },
    {
      href: "/admin/audit",
      label: "Журнал действий",
      permission: "audit:read" as const,
      icon: History,
    },
    {
      href: "/admin/suppliers",
      label: "Поставщики",
      permission: "suppliers:manage" as const,
      icon: Store,
    },
  ].filter((row) => can(row.permission));
  return (
    <Workspace kind="admin" newRequestsCount={requestStats[0]?.value}>
      <header className={styles.pageHeading}>
        <div>
          <h1>Обзор</h1>
          <p>Заказы, ассортимент и задачи, требующие внимания.</p>
        </div>
        <span className={styles.headingMeta}>Управление платформой</span>
      </header>
      <div className={styles.metrics}>
        {cards.map((card) => (
          <Link
            href={card.href}
            className={styles.metric}
            data-attention={card.attention}
            key={card.href}
          >
            <div className={styles.metricTop}>
              <span>{card.label}</span>
              <card.icon size={19} />
            </div>
            <strong>{card.value}</strong>
            <small>{card.note}</small>
          </Link>
        ))}
      </div>
      <div className={styles.dashboardGrid}>
        {can("orders:read") && (
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Последние заказы</h2>
              <Link href="/admin/orders">Все заказы →</Link>
            </div>
            <div className={styles.queue}>
              {recent.map((order) => (
                <Link className={styles.queueRow} href={`/admin/orders/${order.id}`} key={order.id}>
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <small>{order.customerName}</small>
                  </div>
                  <span>
                    <strong>{formatTJS(order.totalDirams)}</strong>
                    <small>{ORDER_STATUS_LABELS[order.status] ?? order.status}</small>
                  </span>
                </Link>
              ))}
              {!recent.length && (
                <p className={styles.emptyText}>
                  Заказы появятся здесь после оформления покупателями.
                </p>
              )}
            </div>
          </section>
        )}
        {can("catalog:manage") && (
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Проверка товаров</h2>
              <Link href="/admin/catalog?status=PENDING">Открыть очередь →</Link>
            </div>
            <div className={styles.queue}>
              {pending.map((product) => (
                <Link
                  className={styles.queueRow}
                  href={`/admin/catalog?q=${encodeURIComponent(product.sku)}&status=PENDING`}
                  key={product.id}
                >
                  <div>
                    <strong>{product.name}</strong>
                    <small>{product.sku}</small>
                  </div>
                  <ArrowRight size={17} />
                </Link>
              ))}
              {!pending.length && <p className={styles.emptyText}>Все товары проверены.</p>}
            </div>
          </section>
        )}
        {shortcuts.length > 0 && (
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Быстрые переходы</h2>
            </div>
            <div className={styles.quickLinks}>
              {shortcuts.map((row) => (
                <Link href={row.href} key={row.href}>
                  <row.icon size={20} />
                  {row.label}
                  <ArrowRight size={16} />
                </Link>
              ))}
            </div>
          </section>
        )}
        {!cards.length && !shortcuts.length && (
          <section className={styles.panel}>
            <h2>Доступ к рабочим разделам</h2>
            <p className={styles.emptyText}>
              Для вашей роли пока не назначены рабочие разделы. Обратитесь к администратору
              платформы.
            </p>
          </section>
        )}
      </div>
    </Workspace>
  );
}

import Link from "next/link";
import { and, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { Workspace } from "@/components/workspace";
import { Badge, DataTable } from "@/components/admin-ui";
import { DeliveryAssignment } from "@/components/delivery-assignment";
import { requirePagePermission } from "@/modules/auth/page";
import { hasPermission } from "@/modules/rbac/permissions";
import { ORDER_STATUS_LABELS } from "@/modules/orders/status";
import { VEHICLE_OPTIONS, deliveryDateLabel } from "@/modules/delivery/preferences";
import styles from "@/components/workspace-design.module.css";
export const dynamic = "force-dynamic";
export default async function DeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const actor = await requirePagePermission("deliveries:manage", "/admin/deliveries");
  const db = await getDb(),
    params = await searchParams,
    q = (params.q ?? "").trim().slice(0, 200),
    status = ORDER_STATUS_LABELS[params.status ?? ""] ? params.status! : "";
  const conditions = [ne(orders.vehicleType, "PICKUP")];
  if (status) conditions.push(eq(orders.status, status));
  if (q)
    conditions.push(
      or(
        ilike(orders.orderNumber, `%${q}%`),
        ilike(orders.customerName, `%${q}%`),
        ilike(orders.deliveryCity, `%${q}%`),
      )!,
    );
  const [count] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(orders)
    .where(and(...conditions));
  const pages = Math.max(1, Math.ceil(count.value / 20)),
    requested = Number(params.page ?? 1),
    page = Number.isSafeInteger(requested) ? Math.min(pages, Math.max(1, requested)) : 1;
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      customerName: orders.customerName,
      customerPhone: orders.customerPhone,
      city: orders.deliveryCity,
      address: orders.deliveryAddress,
      vehicleType: orders.vehicleType,
      date: orders.preferredDeliveryDate,
      driverName: orders.driverName,
      driverPhone: orders.driverPhone,
      vehiclePlate: orders.vehiclePlate,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt))
    .limit(20)
    .offset((page - 1) * 20);
  const href = (n: number) =>
    `/admin/deliveries?${new URLSearchParams({ q, status, page: String(n) })}`;
  return (
    <Workspace kind="admin">
      <header className={styles.pageHeading}>
        <div>
          <h1>Доставки</h1>
          <p>Транспорт, адреса и назначение водителей по заказам.</p>
        </div>
        <span className={styles.headingMeta}>Найдено: {count.value}</span>
      </header>
      <form className={styles.filterForm}>
        <input
          className="input"
          name="q"
          defaultValue={q}
          aria-label="Поиск доставок"
          placeholder="Заказ, город или получатель"
        />
        <select className="input" name="status" defaultValue={status} aria-label="Статус доставки">
          <option value="">Все статусы</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
        <button className="button button-primary">Найти</button>
      </form>
      <DataTable
        headers={[
          "Заказ",
          "Получатель и адрес",
          "Транспорт",
          "Желаемая дата",
          "Водитель",
          "Действие",
        ]}
      >
        {rows.map((order) => (
          <tr key={order.id}>
            <td>
              <strong>{order.orderNumber}</strong>
              <br />
              <Badge
                tone={
                  order.status === "DELIVERED"
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
              <strong>{order.customerName}</strong>
              <br />
              {order.city}, {order.address}
              <br />
              <a className="inline-link" href={`tel:${order.customerPhone}`}>
                {order.customerPhone}
              </a>
            </td>
            <td>
              {VEHICLE_OPTIONS.find((row) => row.code === order.vehicleType)?.title ??
                order.vehicleType}
            </td>
            <td>{order.date ? deliveryDateLabel(order.date) : "По согласованию"}</td>
            <td>
              {order.driverName ? (
                <>
                  <strong>{order.driverName}</strong>
                  <br />
                  <a className="inline-link" href={`tel:${order.driverPhone}`}>
                    {order.driverPhone}
                  </a>
                  <br />
                  {order.vehiclePlate}
                </>
              ) : (
                "Не назначен"
              )}
            </td>
            <td>
              {hasPermission(actor.role, "deliveries:assign") &&
              ["CONFIRMED", "DISPATCHED"].includes(order.status) ? (
                <DeliveryAssignment
                  order={{ ...order, updatedAt: order.updatedAt.toISOString() }}
                />
              ) : order.status === "NEW" ? (
                <span className="muted">Ожидает подтверждения заказа</span>
              ) : (
                <span className="muted">
                  {["DELIVERED", "CANCELLED"].includes(order.status)
                    ? "Заказ завершён"
                    : "Назначение выполняет логист"}
                </span>
              )}
            </td>
          </tr>
        ))}
      </DataTable>
      {!rows.length && (
        <p className={styles.emptyText}>Доставки по выбранным условиям не найдены.</p>
      )}
      <div className="pagination">
        {page > 1 ? (
          <Link className="button button-secondary" href={href(page - 1)}>
            Назад
          </Link>
        ) : (
          <span />
        )}
        <span>
          {page} / {pages}
        </span>
        {page < pages ? (
          <Link className="button button-secondary" href={href(page + 1)}>
            Далее
          </Link>
        ) : (
          <span />
        )}
      </div>
    </Workspace>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Workspace } from "@/components/workspace";
import { DataTable, Badge } from "@/components/admin-ui";
import { OrderStatusControl } from "@/components/order-status-control";
import { PaymentControls } from "@/components/payment-controls";
import {
  getOrderPaymentSummary,
  listOrderPayments,
  PAYMENT_LABELS,
} from "@/modules/orders/payment-service";
import { PrintButton } from "@/components/print-button";
import { requirePagePermission } from "@/modules/auth/page";
import { hasPermission } from "@/modules/rbac/permissions";
import { getManagedOrder } from "@/modules/orders/service";
import { ORDER_STATUS_LABELS } from "@/modules/orders/status";
import { formatTJS } from "@/modules/system/money";
import { formatDateTime } from "@/i18n";
import {
  VEHICLE_OPTIONS,
  TIME_SLOTS,
  deliveryDateLabel,
  type DeliveryTimeSlot,
} from "@/modules/delivery/preferences";
import styles from "@/components/workspace-design.module.css";
export const dynamic = "force-dynamic";
export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requirePagePermission("orders:read", `/admin/orders/${id}`);
  const order = await getManagedOrder(actor, id);
  if (!order) notFound();
  const [payment, payments] = await Promise.all([
    getOrderPaymentSummary(id),
    listOrderPayments(id),
  ]);
  const vehicle = VEHICLE_OPTIONS.find((row) => row.code === order.vehicleType),
    pickup = order.vehicleType === "PICKUP";
  const shopGroups = new Map<
    string,
    { name: string; status: string; sum: bigint; known: boolean }
  >();
  for (const item of order.items) {
    const key = item.supplierId ?? item.supplierName ?? item.id;
    const group = shopGroups.get(key) ?? {
      name: item.supplierName ?? "Поставщик не указан",
      status: item.shopStatus,
      sum: 0n,
      known: true,
    };
    group.known &&= item.supplierSubtotalDirams !== null;
    if (item.supplierSubtotalDirams !== null) group.sum += BigInt(item.supplierSubtotalDirams);
    shopGroups.set(key, group);
  }
  return (
    <Workspace kind="admin">
      <Link
        className="inline-link"
        href="/admin/orders"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 22,
          fontSize: 13,
        }}
      >
        <ArrowLeft size={15} /> Все заказы
      </Link>
      <header className={styles.pageHeading}>
        <div>
          <h1>Заказ {order.orderNumber}</h1>
          <p>Оформлен {formatDateTime(order.createdAt)}</p>
        </div>
        <PrintButton orderId={order.id} />
      </header>
      <div className={styles.detailGrid}>
        <div style={{ display: "grid", gap: 22, minWidth: 0, alignContent: "start" }}>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Состав заказа</h2>
              <Badge>{order.items.length} поз.</Badge>
            </div>
            <DataTable headers={["Материал", "Количество", "Цена", "Сумма"]}>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.productName}</strong>
                    <br />
                    <small className="muted">{item.sku}</small>
                  </td>
                  <td>
                    {item.qty} {item.unit}
                  </td>
                  <td>{formatTJS(item.priceDirams)}</td>
                  <td>
                    <strong>{formatTJS(item.subtotalDirams)}</strong>
                  </td>
                </tr>
              ))}
            </DataTable>
            <div className={styles.resultsInfo}>
              <span>Сумма материалов</span>
              <strong>{formatTJS(order.materialsTotalDirams)}</strong>
            </div>
            <div className={styles.resultsInfo}>
              <span>Доставка</span>
              <strong>
                {pickup
                  ? "Самовывоз"
                  : BigInt(order.deliveryTotalDirams) > 0n
                    ? formatTJS(order.deliveryTotalDirams)
                    : "Согласуется отдельно"}
              </strong>
            </div>
            <div
              className={styles.resultsInfo}
              style={{
                fontSize: 18,
                color: "#102f57",
                borderTop: "1px solid #dce3ec",
                paddingTop: 18,
              }}
            >
              <span>Итого</span>
              <strong>{formatTJS(order.totalDirams)}</strong>
            </div>
          </section>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Закупка у поставщиков</h2>
            </div>
            <DataTable headers={["Поставщик", "Закупочная сумма"]}>
              {[...shopGroups].map(([key, shop]) => (
                <tr key={key}>
                  <td>
                    <strong>{shop.name}</strong>
                  </td>
                  <td>{shop.known ? formatTJS(shop.sum) : "Не сохранена"}</td>
                </tr>
              ))}
            </DataTable>
            {order.markupPercent !== null && (
              <p className={styles.subtle}>
                Наценка платформы: {order.markupPercent}%
                {order.markupDirams !== null ? ` · ${formatTJS(order.markupDirams)}` : ""}. Сумма
                материалов в заказе уже включает наценку.
              </p>
            )}
          </section>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>История выполнения</h2>
            </div>
            {order.history.map((event) => (
              <div className={styles.queueRow} key={event.id}>
                <div>
                  <strong>{event.title}</strong>
                  <small>{event.description}</small>
                </div>
                <small>{formatDateTime(event.timestamp)}</small>
              </div>
            ))}
          </section>
        </div>
        <div style={{ display: "grid", gap: 22, minWidth: 0, alignContent: "start" }}>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Статус заказа</h2>
              <Badge
                tone={
                  order.status === "CANCELLED"
                    ? "danger"
                    : order.status === "DELIVERED"
                      ? "success"
                      : "info"
                }
              >
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
            </div>
            {hasPermission(actor.role, "orders:manage") && (
              <OrderStatusControl id={order.id} status={order.status} />
            )}
            <p className={styles.subtle}>
              Оплата: {order.paymentMethod === "BANK_INVOICE" ? "По счёту" : "При получении"}.
              Способ оплаты не подтверждает факт поступления денег.
            </p>
          </section>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Оплата</h2>
              <Badge tone={payment.status === "PAID" ? "success" : "warning"}>
                {PAYMENT_LABELS[payment.status]}
              </Badge>
            </div>
            <dl className={styles.details}>
              <dt>Получено с учётом возвратов</dt>
              <dd>{formatTJS(payment.paidDirams)}</dd>
              <dt>Остаток к оплате</dt>
              <dd>{formatTJS(payment.balanceDirams)}</dd>
            </dl>
            {hasPermission(actor.role, "orders:manage") && (
              <PaymentControls
                key={`${payment.paidDirams}:${order.status}`}
                id={id}
                paidDirams={payment.paidDirams}
                balanceDirams={payment.balanceDirams}
                cancelled={order.status === "CANCELLED"}
              />
            )}
          </section>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>История оплаты</h2>
            </div>
            {!payments.length && (
              <p className={styles.subtle}>Поступления и возвраты пока не записаны.</p>
            )}
            {payments.map((entry) => (
              <div className={styles.queueRow} key={entry.id}>
                <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                  <strong>
                    {entry.kind === "PAYMENT" ? "Получена оплата" : "Возврат"} ·{" "}
                    {formatTJS(entry.amountDirams)}
                  </strong>
                  <small>
                    {(
                      {
                        BANK_TRANSFER: "Банковский перевод",
                        CASH: "Наличные",
                        OTHER: "Другой способ",
                      } as Record<string, string>
                    )[entry.method] ?? entry.method}
                    {entry.reference ? ` · ${entry.reference}` : ""}
                  </small>
                  <small style={{ overflowWrap: "anywhere" }}>{entry.reason}</small>
                </div>
                <small>{formatDateTime(entry.createdAt)}</small>
              </div>
            ))}
          </section>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Получатель</h2>
            </div>
            <dl className={styles.details}>
              <dt>Имя</dt>
              <dd>{order.customerName}</dd>
              <dt>Телефон</dt>
              <dd>
                <a className="inline-link" href={`tel:${order.customerPhone}`}>
                  {order.customerPhone}
                </a>
              </dd>
              <dt>{pickup ? "Город выдачи" : "Адрес"}</dt>
              <dd>{[order.deliveryCity, order.deliveryAddress].filter(Boolean).join(", ")}</dd>
              {order.deliveryNotes && (
                <>
                  <dt>Комментарий</dt>
                  <dd>{order.deliveryNotes}</dd>
                </>
              )}
            </dl>
          </section>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>{pickup ? "Самовывоз" : "Доставка"}</h2>
            </div>
            <dl className={styles.details}>
              <dt>Транспорт</dt>
              <dd>{pickup ? "Со склада" : (vehicle?.title ?? "Уточняется")}</dd>
              <dt>Желаемая дата</dt>
              <dd>
                {order.preferredDeliveryDate
                  ? deliveryDateLabel(order.preferredDeliveryDate)
                  : "По согласованию"}
              </dd>
              <dt>Интервал</dt>
              <dd>
                {order.preferredTimeSlot
                  ? TIME_SLOTS[order.preferredTimeSlot as DeliveryTimeSlot]
                  : "По согласованию"}
              </dd>
              <dt>Водитель</dt>
              <dd>{order.driverName ?? "Не назначен"}</dd>
              <dt>Госномер</dt>
              <dd>{order.vehiclePlate ?? "Не назначен"}</dd>
            </dl>
          </section>
        </div>
      </div>
    </Workspace>
  );
}

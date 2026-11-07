import { PrintButton } from "@/components/print-button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { Badge, DataTable } from "@/components/admin-ui";
import { ShopOrderStatusControl } from "@/components/shop-order-status-control";
import { requirePageUser } from "@/modules/auth/page";
import { getShopOrder } from "@/modules/suppliers/shop-service";
import { ORDER_STATUS_LABELS } from "@/modules/orders/status";
import { formatTJS } from "@/modules/system/money";
import { formatDateTime } from "@/i18n";
import { ApiError } from "@/server/api-error";
import styles from "@/components/workspace-design.module.css";
export const dynamic = "force-dynamic";
export default async function ShopOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requirePageUser(["SUPPLIER_OWNER", "SUPPLIER_STAFF"], `/seller/orders/${id}`);
  let order;
  try {
    order = await getShopOrder(actor, id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  return (
    <Workspace kind="seller">
      <Link
        href="/seller/orders"
        className="inline-link"
        style={{ display: "inline-block", marginBottom: 22 }}
      >
        ← Заказы магазина
      </Link>
      <header className={styles.pageHeading}>
        <div>
          <h1>Заказ {order.orderNumber}</h1>
          <p>Оформлен {formatDateTime(order.createdAt)} · только товары вашего магазина</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Badge>{ORDER_STATUS_LABELS[order.status] ?? order.status}</Badge>
          <PrintButton orderId={order.id} />
        </div>
      </header>
      <div className={styles.detailGrid}>
        <div style={{ display: "grid", gap: 22, minWidth: 0 }}>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Ваши товары</h2>
            </div>
            <DataTable headers={["Товар", "Количество", "Цена магазина", "Сумма магазина"]}>
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
                  <td>
                    {item.supplierPriceDirams !== null
                      ? formatTJS(item.supplierPriceDirams)
                      : "Не сохранена"}
                  </td>
                  <td>
                    {item.supplierSubtotalDirams !== null
                      ? formatTJS(item.supplierSubtotalDirams)
                      : "Не сохранена"}
                  </td>
                </tr>
              ))}
            </DataTable>
            <dl className={styles.details} style={{ marginTop: 24 }}>
              <dt>Сумма магазина</dt>
              <dd>
                <strong>
                  {order.supplierTotalDirams !== null
                    ? formatTJS(order.supplierTotalDirams)
                    : "Не сохранена для этого заказа"}
                </strong>
              </dd>
              <dt>Наценка платформы</dt>
              <dd>{order.markupPercent !== null ? `${order.markupPercent}%` : "Не указана"}</dd>
              <dt>Сумма покупателя</dt>
              <dd>{formatTJS(order.retailTotalDirams)}</dd>
            </dl>
            <p className={styles.subtle}>
              Показана сумма покупателя только за ваши товары. Ставка наценки определяется общей
              суммой материалов всего заказа до наценки, без доставки.
            </p>
          </section>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Получатель и получение</h2>
            </div>
            <dl className={styles.details}>
              <dt>Получатель</dt>
              <dd>{order.customerName}</dd>
              <dt>Телефон</dt>
              <dd>
                <a className="inline-link" href={`tel:${order.customerPhone}`}>
                  {order.customerPhone}
                </a>
              </dd>
              <dt>Способ получения</dt>
              <dd>{order.vehicleType === "PICKUP" ? "Самовывоз" : "Доставка"}</dd>
              <dt>Адрес</dt>
              <dd>{[order.deliveryCity, order.deliveryAddress].filter(Boolean).join(", ")}</dd>
              {order.deliveryNotes && (
                <>
                  <dt>Комментарий</dt>
                  <dd>{order.deliveryNotes}</dd>
                </>
              )}
            </dl>
          </section>
        </div>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Подготовка магазином</h2>
          </div>
          <ShopOrderStatusControl
            id={order.id}
            status={order.shopStatus}
            orderStatus={order.status}
            canManage={order.canManage}
          />
          {order.shopStatus !== "NEW" && (
            <p className={styles.subtle}>Обновлено: {formatDateTime(order.shopUpdatedAt)}</p>
          )}
          <p className={styles.subtle}>
            Если требуется изменить состав или отменить заказ, согласуйте это с платформой.
          </p>
        </section>
      </div>
    </Workspace>
  );
}

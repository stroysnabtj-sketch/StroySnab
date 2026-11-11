"use client";

import { useEffect, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Clock,
  FileText,
  MapPin,
  Package,
  RefreshCw,
  ShieldCheck,
  Truck,
  Warehouse,
  Weight,
} from "lucide-react";
import { formatTJS } from "@/modules/system/money";
import { formatDateTime } from "@/i18n";
import {
  VEHICLE_OPTIONS,
  TIME_SLOTS,
  deliveryDateLabel,
  type DeliveryTimeSlot,
} from "@/modules/delivery/preferences";
import { PrintButton } from "@/components/print-button";
import styles from "./order-status.module.css";

const UNLOADING_LABELS: Record<string, string> = {
  SELF: "Самостоятельная разгрузка",
  LOADERS: "Требуются грузчики",
  CRANE_BOOM: "Разгрузка манипулятором",
  DUMP: "Самосвальная разгрузка",
  SELF_PICKUP: "Самовывоз",
};

export type OrderDashboardProps = {
  payment: { status: string; paidDirams: string; balanceDirams: string };
  guestRegistrationHref?: string;
  order: {
    id: string;
    orderNumber: string;
    customerId?: string | null;
    customerName: string;
    customerPhone: string;
    deliveryCity: string;
    deliveryAddress: string;
    deliveryLat?: string | null;
    deliveryLng?: string | null;
    deliveryNotes?: string | null;
    vehicleType: string;
    unloadingType: string;
    preferredDeliveryDate?: string | null;
    preferredTimeSlot?: string | null;
    status: string;
    paymentMethod: string;
    materialsTotalDirams: string;
    deliveryTotalDirams: string;
    totalDirams: string;
    estimatedWeightKg?: string | null;
    estimatedVolumeM3?: string | null;
    driverName?: string | null;
    driverPhone?: string | null;
    vehiclePlate?: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
    items: Array<{
      id: string;
      productName: string;
      sku: string;
      unit: string;
      qty: string;
      priceDirams: string;
      subtotalDirams: string;
      supplierName?: string | null;
    }>;
    history: Array<{
      id: string;
      status: string;
      title: string;
      description: string;
      timestamp: string | Date;
    }>;
  };
};

export function OrderStatusDashboard({
  order,
  payment,
  guestRegistrationHref,
}: OrderDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isPickup = order.vehicleType === "PICKUP";
  const vehicle = VEHICLE_OPTIONS.find((v) => v.code === order.vehicleType);

  const statusLabels: Record<string, string> = {
    NEW: "Заказ получен",
    CONFIRMED: "Подтверждён",
    DISPATCHED: isPickup ? "Готов к выдаче" : "В доставке",
    DELIVERED: isPickup ? "Получен" : "Доставлен",
    CANCELLED: "Отменён",
  };

  const steps = [
    {
      key: "NEW",
      label: "Заказ получен",
      sub: "Обработка и бронирование",
    },
    {
      key: "CONFIRMED",
      label: "Подтверждён",
      sub: "Комплектация на складе",
    },
    {
      key: "DISPATCHED",
      label: isPickup ? "Готов к выдаче" : "В доставке",
      sub: isPickup ? "Ожидает на складе" : "Машина в пути к объекту",
    },
    {
      key: "DELIVERED",
      label: isPickup ? "Получен" : "Доставлен",
      sub: "Заказ успешно передан",
    },
  ];

  const stepOrder = ["NEW", "CONFIRMED", "DISPATCHED", "DELIVERED"];
  const currentIndex = stepOrder.indexOf(order.status);
  const statusMessages: Record<string, { title: string; detail: string }> = {
    NEW: {
      title: "Заказ принят в обработку",
      detail: "Магазин проверит наличие материалов и свяжется с вами для подтверждения.",
    },
    CONFIRMED: {
      title: "Материалы готовят к выдаче",
      detail: isPickup
        ? "Дождитесь сообщения о готовности и согласуйте время приезда на склад."
        : "Следующий этап — передача заказа в доставку. Условия и время согласуют с вами.",
    },
    DISPATCHED: {
      title: isPickup ? "Заказ готов к получению" : "Заказ передан в доставку",
      detail: isPickup
        ? "Перед выездом уточните адрес склада и условия выдачи у магазина."
        : "Если водитель назначен, его контакты указаны в блоке транспорта. Точное время прибытия уточняйте по телефону.",
    },
    DELIVERED: {
      title: "Заказ выполнен",
      detail: "Состав заказа, стоимость и история выполнения сохранены на этой странице.",
    },
    CANCELLED: {
      title: "Заказ отменён",
      detail: "Дальнейшее выполнение остановлено. Для нового заказа вернитесь в каталог.",
    },
  };
  const currentMessage = statusMessages[order.status];

  // Auto-refresh every 30 seconds for active orders
  useEffect(() => {
    if (["NEW", "CONFIRMED", "DISPATCHED"].includes(order.status)) {
      const timer = setInterval(() => {
        startTransition(() => {
          router.refresh();
        });
      }, 30000);
      return () => clearInterval(timer);
    }
  }, [order.status, router]);

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className={styles.page}>
      <Link href="/catalog" className={styles.backLink}>
        <ArrowLeft size={16} /> В каталог материалов
      </Link>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Заказ № {order.orderNumber}</h1>
            <span className={styles.statusBadge} data-status={order.status}>
              {statusLabels[order.status] ?? order.status}
            </span>
          </div>
          <div className={styles.metaRow}>
            <span>Оформлен: {formatDateTime(order.createdAt)}</span>
            <span>Обновлён: {formatDateTime(order.updatedAt)}</span>
          </div>
        </div>

        <div className={styles.actions}>
          {guestRegistrationHref && (
            <Link href={guestRegistrationHref} className={styles.refreshButton}>
              Создать аккаунт
            </Link>
          )}
          <button
            type="button"
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={isPending}
            title="Обновить данные заказа"
          >
            <RefreshCw size={15} className={isPending ? styles.spinning : ""} />
            {isPending ? "Обновление…" : "Обновить статус"}
          </button>
          <PrintButton orderId={order.id} />
        </div>
      </header>

      {currentMessage && (
        <section className={styles.statusOverview} data-status={order.status} aria-live="polite">
          <div className={styles.overviewIcon}>
            {order.status === "CANCELLED" ? (
              <AlertCircle size={28} />
            ) : order.status === "DELIVERED" ? (
              <Check size={28} />
            ) : (
              <Package size={28} />
            )}
          </div>
          <div>
            <span className={styles.overviewEyebrow}>Текущий статус</span>
            <h2>{currentMessage.title}</h2>
            <p>{currentMessage.detail}</p>
          </div>
        </section>
      )}
      {/* Stepper */}
      <section className={styles.stepperContainer} aria-label="Этапы выполнения заказа">
        <h2 className={styles.stepperTitle}>Ход выполнения заказа</h2>
        <div className={styles.stepper}>
          {steps.map((step, index) => {
            let state: "completed" | "active" | "upcoming" = "upcoming";
            if (order.status === "CANCELLED") {
              state = "upcoming";
            } else if (order.status === "DELIVERED") {
              state = "completed";
            } else if (index < currentIndex) {
              state = "completed";
            } else if (index === currentIndex) {
              state = "active";
            }

            return (
              <div
                key={step.key}
                className={styles.step}
                data-state={state}
                aria-current={state === "active" ? "step" : undefined}
              >
                <div className={styles.stepBar} />
                <div className={styles.stepHeader}>
                  <span className={styles.stepNumber}>
                    {state === "completed" ? <Check size={12} strokeWidth={3} /> : index + 1}
                  </span>
                  <div className={styles.stepText}>
                    <span className={styles.stepLabel}>{step.label}</span>
                    <span className={styles.stepSub}>
                      {state === "upcoming" ? "Следующий этап" : step.sub}
                    </span>
                    {order.history.find((event) => event.status === step.key) && (
                      <time
                        className={styles.stepDate}
                        dateTime={new Date(
                          order.history.find((event) => event.status === step.key)!.timestamp,
                        ).toISOString()}
                      >
                        {formatDateTime(
                          order.history.find((event) => event.status === step.key)!.timestamp,
                        )}
                      </time>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {order.status === "CANCELLED" && (
          <div className={styles.cancelledBanner}>
            <AlertCircle size={20} />
            <div>
              <strong>Заказ отменён</strong>
              <p style={{ margin: "4px 0 0" }}>
                Если отмена произошла по ошибке, свяжитесь с магазином перед оформлением нового
                заказа.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Main Grid */}
      <div className={styles.dashboardGrid}>
        <div className={styles.mainColumn}>
          {/* Transport / Pickup Card */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>
                {isPickup ? <Warehouse size={20} /> : <Truck size={20} />}
                {isPickup ? "Способ получения: Самовывоз" : "Транспорт и доставка"}
              </h2>
              <span className={styles.cardBadge}>
                {isPickup ? "Склад поставщика" : "Грузовая логистика"}
              </span>
            </div>

            {!isPickup && vehicle ? (
              <>
                <div className={styles.vehicleHero}>
                  <div className={styles.vehiclePhoto}>
                    <Image
                      src={vehicle.photoUrl}
                      alt={vehicle.title}
                      fill
                      sizes="(max-width: 900px) 100vw, 240px"
                    />
                  </div>
                  <div className={styles.vehicleInfo}>
                    <h3 className={styles.vehicleName}>{vehicle.title}</h3>
                    <div className={styles.vehicleSpecs}>
                      <span className={styles.specBadge}>
                        <Weight size={13} /> До {vehicle.capacityKg.toLocaleString("ru")} кг
                      </span>
                      <span className={styles.specBadge}>
                        <Package size={13} /> {vehicle.volumeM3} м³
                      </span>
                    </div>
                    <span className={styles.vehicleDimensions}>Габариты: {vehicle.dimensions}</span>
                  </div>
                </div>

                <div className={styles.vehicleDetailsGrid}>
                  <div className={styles.infoTile}>
                    <span className={styles.infoTileLabel}>Желаемая дата</span>
                    <span className={styles.infoTileValue}>
                      {order.preferredDeliveryDate
                        ? deliveryDateLabel(order.preferredDeliveryDate)
                        : "По согласованию"}
                    </span>
                    <span className={styles.infoTileSub}>
                      {order.preferredTimeSlot
                        ? TIME_SLOTS[order.preferredTimeSlot as DeliveryTimeSlot]
                        : "Интервал согласуется"}
                    </span>
                  </div>

                  <div className={styles.infoTile}>
                    <span className={styles.infoTileLabel}>Способ разгрузки</span>
                    <span className={styles.infoTileValue}>
                      {UNLOADING_LABELS[order.unloadingType] ?? "Самостоятельно"}
                    </span>
                    <span className={styles.infoTileSub}>На объекте заказчика</span>
                  </div>

                  <div className={styles.infoTile}>
                    <span className={styles.infoTileLabel}>Расчётный вес груза</span>
                    <span className={styles.infoTileValue}>
                      {order.estimatedWeightKg ? `${order.estimatedWeightKg} кг` : "Уточняется"}
                    </span>
                    <span className={styles.infoTileSub}>Данные заказа</span>
                  </div>

                  <div className={styles.infoTile}>
                    <span className={styles.infoTileLabel}>Расчётный объём</span>
                    <span className={styles.infoTileValue}>
                      {order.estimatedVolumeM3 ? `${order.estimatedVolumeM3} м³` : "—"}
                    </span>
                    <span className={styles.infoTileSub}>Указанный объём груза</span>
                  </div>

                  <div className={styles.driverBox}>
                    <ShieldCheck size={22} style={{ flexShrink: 0 }} />
                    <div>
                      <h4 className={styles.driverBoxTitle}>
                        {order.driverName ? "Назначенный транспорт и водитель" : "Статус рейса"}
                      </h4>
                      <p className={styles.driverBoxText}>
                        {order.driverName ? (
                          <>
                            Водитель: <strong>{order.driverName}</strong>
                            {order.driverPhone ? ` · Тел: ${order.driverPhone}` : ""}
                            {order.vehiclePlate ? ` · Госномер: ${order.vehiclePlate}` : ""}
                          </>
                        ) : (
                          "Машина и водитель назначаются диспетчером после подтверждения готовности материалов складом."
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : isPickup ? (
              <div className={styles.vehicleDetailsGrid}>
                <div className={`${styles.infoTile} ${styles.pickupLocation}`}>
                  <span className={styles.infoTileLabel}>Пункт выдачи</span>
                  <span className={styles.infoTileValue}>
                    {order.deliveryCity}, адрес склада согласовывается с магазином
                  </span>
                  <span className={styles.infoTileSub}>
                    После комплектации заказа менеджер магазина свяжется с вами и сообщит точный
                    адрес склада и время выдачи.
                  </span>
                </div>
                <div className={styles.infoTile}>
                  <span className={styles.infoTileLabel}>Желаемая дата готовности</span>
                  <span className={styles.infoTileValue}>
                    {order.preferredDeliveryDate
                      ? deliveryDateLabel(order.preferredDeliveryDate)
                      : "По согласованию"}
                  </span>
                </div>
                <div className={styles.infoTile}>
                  <span className={styles.infoTileLabel}>Погрузка</span>
                  <span className={styles.infoTileValue}>Уточняется с магазином</span>
                </div>
              </div>
            ) : null}
          </section>

          {/* Destination & Contacts Card */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>
                <MapPin size={20} />
                {isPickup ? "Контакты и получение" : "Адрес и получатель"}
              </h2>
            </div>

            <div className={styles.routeList}>
              <div className={styles.routePoint}>
                <div className={styles.routeIcon}>
                  <Warehouse size={16} />
                </div>
                <div className={styles.routePointBody}>
                  <span className={styles.routePointLabel}>Откуда</span>
                  <span className={styles.routePointAddress}>
                    Склады поставщиков платформы Stroysnab.tj
                  </span>
                </div>
              </div>

              <div className={styles.routePoint}>
                <div className={styles.routeIcon}>
                  <MapPin size={16} />
                </div>
                <div className={styles.routePointBody}>
                  <span className={styles.routePointLabel}>
                    {isPickup ? "Город выдачи" : "Куда доставить"}
                  </span>
                  <span className={styles.routePointAddress}>
                    {[order.deliveryCity, order.deliveryAddress].filter(Boolean).join(", ")}
                    {order.deliveryLat && order.deliveryLng && (
                      <a
                        className="inline-link"
                        style={{ display: "block", marginTop: 6 }}
                        href={`https://www.openstreetmap.org/?mlat=${encodeURIComponent(order.deliveryLat)}&mlon=${encodeURIComponent(order.deliveryLng)}#map=17/${encodeURIComponent(order.deliveryLat)}/${encodeURIComponent(order.deliveryLng)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        На карте
                      </a>
                    )}
                  </span>
                  <span className={styles.routePointContact}>
                    Получатель: {order.customerName} · {order.customerPhone}
                  </span>
                </div>
              </div>

              {order.deliveryNotes && (
                <div className={styles.deliveryNote}>
                  <strong>Комментарий заказчика:</strong> {order.deliveryNotes}
                </div>
              )}
            </div>
          </section>

          {/* Items Table */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>
                <FileText size={20} />
                Состав заказа ({order.items.length})
              </h2>
            </div>

            <div className={styles.itemsWrap}>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th>Материал</th>
                    <th>Магазин</th>
                    <th>Кол-во</th>
                    <th>Цена</th>
                    <th style={{ textAlign: "right" }}>Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td data-label="Материал">
                        <p className={styles.itemTitle}>{item.productName}</p>
                        <span className={styles.itemSku}>Арт: {item.sku}</span>
                      </td>
                      <td data-label="Магазин">
                        <span className={styles.itemSupplier}>
                          {item.supplierName ?? "Партнёр Stroysnab.tj"}
                        </span>
                      </td>
                      <td data-label="Количество">
                        {item.qty} {item.unit}
                      </td>
                      <td data-label="Цена за единицу">{formatTJS(item.priceDirams)}</td>
                      <td data-label="Сумма" className={styles.itemSubtotal}>
                        {formatTJS(item.subtotalDirams)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Chronological History */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>
                <Clock size={20} />
                История событий заказа
              </h2>
              <span className={styles.cardBadge}>Подтверждённые отметки</span>
            </div>

            <div className={styles.timeline}>
              {order.history.map((event) => (
                <div key={event.id} className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <span className={styles.timelineTitle}>{event.title}</span>
                  {event.description && <p className={styles.timelineDesc}>{event.description}</p>}
                  <span className={styles.timelineTime}>{formatDateTime(event.timestamp)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className={styles.sideColumn}>
          {/* Order Summary */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle} style={{ marginBottom: "16px" }}>
              Сумма заказа
            </h2>

            <div className={styles.summaryRow}>
              <span>Материалы ({order.items.length} поз.)</span>
              <strong>{formatTJS(order.materialsTotalDirams)}</strong>
            </div>

            <div className={styles.summaryRow}>
              <span>Доставка</span>
              <span>
                {isPickup
                  ? "Самовывоз"
                  : BigInt(order.deliveryTotalDirams) > 0n
                    ? formatTJS(order.deliveryTotalDirams)
                    : "Согласуется отдельно"}
              </span>
            </div>

            <div className={styles.summaryTotalRow}>
              <span>Итого</span>
              <strong className={styles.totalPrice}>{formatTJS(order.totalDirams)}</strong>
            </div>

            <div className={styles.summaryRow} style={{ gap: 12, flexWrap: "wrap" }}>
              <span>Статус оплаты</span>
              <strong>
                {(
                  {
                    UNPAID: "Не оплачен",
                    PARTIAL: "Частично оплачен",
                    PAID: "Оплачен",
                    REFUNDED: "Возвращено",
                  } as Record<string, string>
                )[payment.status] ?? "Уточняется"}
              </strong>
            </div>
            <div className={styles.summaryRow} style={{ gap: 12, flexWrap: "wrap" }}>
              <span>Получено с учётом возвратов</span>
              <strong>{formatTJS(payment.paidDirams)}</strong>
            </div>
            <div className={styles.summaryRow} style={{ gap: 12, flexWrap: "wrap" }}>
              <span>Остаток к оплате</span>
              <strong>{formatTJS(payment.balanceDirams)}</strong>
            </div>
            <div className={styles.paymentNotice}>
              <strong>Способ оплаты:</strong>
              <br />
              {order.paymentMethod === "BANK_INVOICE"
                ? "Безналичный расчёт по счёту. Счёт формируется бухгалтерией после подтверждения заказа."
                : "Оплата при получении заказа. Доступный способ оплаты уточните при подтверждении."}
            </div>
          </div>

          {/* Support / Dispatch Contact */}
          <div className={styles.supportCard}>
            <h3 className={styles.supportTitle}>Диспетчерская служба</h3>
            <p style={{ margin: 0, color: "#6a717e" }}>
              По вопросам изменения рейса, времени подачи или разгрузки обращайтесь к диспетчеру:
            </p>
            <a href="tel:+992446000000" className={styles.supportPhone}>
              +992 (44) 600-00-00
            </a>
            <span style={{ fontSize: "11px", color: "#8a909d" }}>
              Пн–Сб, 08:00–18:00 (время Душанбе)
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}

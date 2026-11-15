"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { ORDER_STATUS_LABELS } from "@/modules/orders/status";
import { deliveryDateLabel, TIME_SLOTS } from "@/modules/delivery/preferences";
import styles from "./delivery-dispatch-map.module.css";

type DispatchDelivery = {
  id: string;
  orderNumber: string;
  status: string;
  city: string;
  address: string;
  lat: string | null;
  lng: string | null;
  date: string | null;
  timeSlot: string | null;
};
function coordinates(delivery: DispatchDelivery): [number, number] | null {
  if (!delivery.lat?.trim() || !delivery.lng?.trim()) return null;
  const lat = Number(delivery.lat),
    lng = Number(delivery.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
    ? [lat, lng]
    : null;
}
function windowLabel(delivery: DispatchDelivery) {
  return `${delivery.date ? deliveryDateLabel(delivery.date) : "Дата по согласованию"} · ${TIME_SLOTS[delivery.timeSlot as keyof typeof TIME_SLOTS] ?? "Время по согласованию"}`;
}
export function DeliveryDispatchMap({
  deliveries,
  canViewOrders,
  total,
  limit,
}: {
  deliveries: DispatchDelivery[];
  canViewOrders: boolean;
  total: number;
  limit: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const mapped = deliveries.filter((delivery) => coordinates(delivery));
  const hasPoints = mapped.length > 0;
  useEffect(() => {
    if (!hasPoints) return;
    let disposed = false;
    let map: LeafletMap | undefined;
    let resize: ResizeObserver | undefined;
    setState("loading");
    void import("leaflet")
      .then((L) => {
        if (disposed || !host.current) return;
        map = L.map(host.current, { scrollWheelZoom: false, zoomControl: true });
        const tiles = L.tileLayer(
          process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            referrerPolicy: "origin",
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
          },
        ).addTo(map);
        tiles.on("tileerror", () => {
          if (!disposed) setState("error");
        });
        tiles.on("load", () => {
          if (!disposed) setState((previous) => (previous === "error" ? previous : "ready"));
        });
        const bounds: [number, number][] = [];
        deliveries.forEach((delivery, index) => {
          const point = coordinates(delivery);
          if (!point || !map) return;
          bounds.push(point);
          const popup = document.createElement("div");
          const link = document.createElement(canViewOrders ? "a" : "strong");
          if (canViewOrders)
            (link as HTMLAnchorElement).href = `/admin/orders/${encodeURIComponent(delivery.id)}`;
          link.textContent = delivery.orderNumber;
          link.className = "inline-link";
          popup.append(link);
          for (const text of [
            ORDER_STATUS_LABELS[delivery.status] ?? delivery.status,
            windowLabel(delivery),
            `${delivery.city}, ${delivery.address}`,
          ]) {
            const line = document.createElement("p");
            line.textContent = text;
            popup.append(line);
          }
          L.marker(point, {
            icon: L.divIcon({
              className: styles.pin,
              html: `<span>${index + 1}</span>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            }),
            keyboard: true,
            title: `${delivery.orderNumber}: ${windowLabel(delivery)}`,
            alt: `Адрес доставки ${delivery.orderNumber}`,
          })
            .addTo(map)
            .bindPopup(popup);
        });
        map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
        resize = new ResizeObserver(() => map?.invalidateSize());
        resize.observe(host.current);
        setState("ready");
      })
      .catch(() => {
        if (!disposed) setState("error");
      });
    return () => {
      disposed = true;
      resize?.disconnect();
      map?.remove();
    };
  }, [deliveries, hasPoints, canViewOrders]);
  return (
    <section className={styles.section} aria-labelledby="delivery-dispatch-title">
      <div className={styles.heading}>
        <div>
          <h2 id="delivery-dispatch-title">Адреса активных доставок</h2>
          <p>Точки получателей и желаемые интервалы доставки. Используются поиск и статус выше.</p>
        </div>
        <p className={styles.count}>
          С точкой: {mapped.length} · Без точки: {deliveries.length - mapped.length}
        </p>
      </div>
      <p className={styles.notice}>
        Показаны адреса заказов, а не местоположение водителей. Дата и время требуют подтверждения
        логиста.
      </p>
      <p className={styles.count}>
        В списке: {deliveries.length} из {total} активных доставок.
        {total > limit
          ? ` Лимит ${limit}; сначала ближайшие даты. Уточните поиск, чтобы увидеть остальные.`
          : ""}
      </p>
      {!deliveries.length ? (
        <p className={styles.empty}>Активных доставок по выбранным условиям нет.</p>
      ) : (
        <div className={styles.layout}>
          <div>
            {hasPoints ? (
              <div
                ref={host}
                className={styles.map}
                role="region"
                aria-label="Карта адресов активных доставок"
              />
            ) : (
              <div className={styles.empty}>
                У этих заказов нет координат. Адреса и интервалы доступны в списке.
              </div>
            )}
            {hasPoints && (
              <p className={styles.status} role="status">
                {state === "loading"
                  ? "Карта загружается. Список заказов уже доступен."
                  : state === "error"
                    ? "Карта или подложка недоступна. Используйте список заказов."
                    : "Номер точки соответствует номеру в списке заказов."}
              </p>
            )}
          </div>
          <ol className={styles.list} aria-label="Адреса и интервалы активных доставок">
            {deliveries.map((delivery, index) => (
              <li key={delivery.id}>
                <span className={styles.number} aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  {canViewOrders ? (
                    <Link className="inline-link" href={`/admin/orders/${delivery.id}`}>
                      <strong>{delivery.orderNumber}</strong>
                    </Link>
                  ) : (
                    <strong>{delivery.orderNumber}</strong>
                  )}
                  <span className={styles.badge}>
                    {ORDER_STATUS_LABELS[delivery.status] ?? delivery.status}
                  </span>
                  <p>{windowLabel(delivery)}</p>
                  <p>
                    {delivery.city}, {delivery.address}
                  </p>
                  {!coordinates(delivery) && (
                    <p className={styles.noPoint}>Координаты не указаны</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

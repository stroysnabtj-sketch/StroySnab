"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import { LocateFixed, Crosshair } from "lucide-react";
import styles from "./address-map.module.css";
export type MapPoint = { lat: number; lng: number };
export function AddressMap({
  value,
  onChange,
}: {
  value: MapPoint | null;
  onChange: (point: MapPoint) => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    map = useRef<LeafletMap | null>(null),
    marker = useRef<Marker | null>(null),
    change = useRef(onChange),
    point = useRef(value),
    [ready, setReady] = useState(false),
    [error, setError] = useState("");
  change.current = onChange;
  point.current = value;
  useEffect(() => {
    let disposed = false;
    let resize: ResizeObserver | undefined;
    void import("leaflet")
      .then((L) => {
        if (disposed || !host.current) return;
        const instance = L.map(host.current, { scrollWheelZoom: true, zoomControl: true }).setView(
          point.current ? [point.current.lat, point.current.lng] : [38.5598, 68.787],
          point.current ? 16 : 12,
        );
        map.current = instance;
        L.tileLayer(
          process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
          },
        ).addTo(instance);
        const icon = L.divIcon({
          className: styles.pin,
          html: "<span></span>",
          iconSize: [32, 40],
          iconAnchor: [16, 36],
        });
        const select = (p: MapPoint) => {
          const next = { lat: Number(p.lat.toFixed(6)), lng: Number(p.lng.toFixed(6)) };
          change.current(next);
        };
        const draw = (p: MapPoint) => {
          if (marker.current) marker.current.setLatLng([p.lat, p.lng]);
          else {
            marker.current = L.marker([p.lat, p.lng], {
              icon,
              draggable: true,
              alt: "Точка доставки",
            }).addTo(instance);
            marker.current.on("dragend", () => {
              const p = marker.current!.getLatLng();
              select(p);
            });
          }
        };
        if (point.current) draw(point.current);
        instance.on("click", (e) => {
          draw(e.latlng);
          select(e.latlng);
        });
        instance.on("keydown", (e) => {
          if (e.originalEvent.key === "Enter" && e.originalEvent.target === host.current) {
            e.originalEvent.preventDefault();
            draw(instance.getCenter());
            select(instance.getCenter());
          }
        });
        instance.on("address:point", () => {
          if (point.current) {
            draw(point.current);
            instance.panTo([point.current.lat, point.current.lng]);
          } else if (marker.current) {
            marker.current.remove();
            marker.current = null;
          }
        });
        resize = new ResizeObserver(() => instance.invalidateSize());
        resize.observe(host.current);
        setReady(true);
      })
      .catch(() => {
        if (!disposed) setError("Карта не загрузилась. Обновите страницу.");
      });
    return () => {
      disposed = true;
      resize?.disconnect();
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);
  useEffect(() => {
    if (ready) map.current?.fire("address:point");
  }, [value?.lat, value?.lng, ready]);
  function center() {
    const p = map.current?.getCenter();
    if (p) change.current({ lat: Number(p.lat.toFixed(6)), lng: Number(p.lng.toFixed(6)) });
  }
  function locate() {
    if (!navigator.geolocation) {
      setError("Определение местоположения недоступно");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setError("");
        const p = { lat: position.coords.latitude, lng: position.coords.longitude };
        change.current(p);
        map.current?.setView([p.lat, p.lng], 16);
      },
      () => setError("Не удалось определить местоположение. Выберите точку на карте."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }
  return (
    <div className={styles.wrap}>
      <div ref={host} className={styles.map} aria-label="Карта выбора адреса доставки" />
      <div className={styles.controls}>
        <button
          type="button"
          disabled={!ready}
          onClick={locate}
          aria-label="Моё местоположение"
          title="Моё местоположение"
        >
          <LocateFixed size={18} />
        </button>
        <button
          type="button"
          disabled={!ready}
          onClick={center}
          aria-label="Выбрать центр карты"
          title="Выбрать центр карты"
        >
          <Crosshair size={18} />
        </button>
      </div>
      <span className="sr-only" role="status">
        {value ? "Точка выбрана" : "Выберите точку на карте"}
      </span>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

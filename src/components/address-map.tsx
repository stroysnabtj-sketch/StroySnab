"use client";
import { useLocale } from "@/i18n/provider";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import { LocateFixed, Crosshair, Search, X } from "lucide-react";
import styles from "./address-map.module.css";
export type MapPoint = { lat: number; lng: number };
type SearchHit = { label: string; city: string; street: string; lat: number; lng: number };
export function AddressMap({
  value,
  onChange,
}: {
  value: MapPoint | null;
  onChange: (point: MapPoint) => void;
}) {
  const { tr } = useLocale();
  const host = useRef<HTMLDivElement>(null),
    map = useRef<LeafletMap | null>(null),
    marker = useRef<Marker | null>(null),
    change = useRef(onChange),
    point = useRef(value),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [searchQuery, setSearchQuery] = useState(""),
    [searching, setSearching] = useState(false),
    [searchHits, setSearchHits] = useState<SearchHit[]>([]);
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
            referrerPolicy: "origin",
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
        if (!disposed) setError(tr("Карта не загрузилась. Обновите страницу."));
      });
    return () => {
      disposed = true;
      resize?.disconnect();
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, [tr]);
  useEffect(() => {
    if (ready) map.current?.fire("address:point");
  }, [value?.lat, value?.lng, ready]);
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchHits([]);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearching(true);
      void fetch(`/api/public/address/search?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data: { items?: SearchHit[] }) => {
          if (!controller.signal.aborted) setSearchHits(data.items ?? []);
        })
        .catch(() => {
          if (!controller.signal.aborted) setSearchHits([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 450);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);
  function pickSearchHit(hit: SearchHit) {
    const next = { lat: Number(hit.lat.toFixed(6)), lng: Number(hit.lng.toFixed(6)) };
    setSearchHits([]);
    setSearchQuery(hit.street || hit.label);
    change.current(next);
    map.current?.setView([next.lat, next.lng], 16);
  }
  function center() {
    const p = map.current?.getCenter();
    if (p) change.current({ lat: Number(p.lat.toFixed(6)), lng: Number(p.lng.toFixed(6)) });
  }
  function locate() {
    if (!navigator.geolocation) {
      setError(tr("Определение местоположения недоступно"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setError("");
        const p = { lat: position.coords.latitude, lng: position.coords.longitude };
        change.current(p);
        map.current?.setView([p.lat, p.lng], 16);
      },
      () => setError(tr("Не удалось определить местоположение. Выберите точку на карте.")),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }
  return (
    <div className={styles.wrap}>
      <div className={styles.searchBox}>
        <div className={styles.searchField}>
          <Search size={16} aria-hidden="true" />
          <input
            type="text"
            aria-label={tr("Поиск улицы или ориентира")}
            placeholder={tr("Поиск улицы или ориентира в Душанбе…")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchHits.length > 0) {
                e.preventDefault();
                pickSearchHit(searchHits[0]);
              }
            }}
          />
          {searchQuery && (
            <button
              type="button"
              aria-label={tr("Очистить поиск")}
              onClick={() => {
                setSearchQuery("");
                setSearchHits([]);
              }}
              style={{ border: 0, background: "transparent", padding: 4, color: "inherit" }}
            >
              <X size={15} />
            </button>
          )}
        </div>
        {(searching || searchHits.length > 0) && (
          <ul className={styles.searchResults} role="listbox" aria-label={tr("Найденные адреса")}>
            {searching && searchHits.length === 0 ? (
              <li style={{ padding: "8px 10px", fontSize: 13, color: "#607087" }}>
                {tr("Ищем адрес…")}
              </li>
            ) : (
              searchHits.map((hit, idx) => (
                <li key={`${hit.lat}:${hit.lng}:${idx}`}>
                  <button type="button" onClick={() => pickSearchHit(hit)}>
                    {hit.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      <div className={styles.mapStage}>
        <div ref={host} className={styles.map} aria-label={tr("Карта выбора адреса доставки")} />
        <div className={styles.controls}>
          <button
            type="button"
            disabled={!ready}
            onClick={locate}
            aria-label={tr("Моё местоположение")}
            title={tr("Моё местоположение")}
          >
            <LocateFixed size={18} />
          </button>
          <button
            type="button"
            disabled={!ready}
            onClick={center}
            aria-label={tr("Выбрать центр карты")}
            title={tr("Выбрать центр карты")}
          >
            <Crosshair size={18} />
          </button>
        </div>
      </div>
      <span className="sr-only" role="status">
        {value ? tr("Точка выбрана") : tr("Выберите точку на карте")}
      </span>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

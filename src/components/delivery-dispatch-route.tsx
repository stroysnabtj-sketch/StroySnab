"use client";

import React, { useState } from "react";
import { TruckArt } from "./truck-art";
import Image from "next/image";
import { type DeliveryVehicle } from "@/modules/delivery/fleet-data";
import { type DeliveryWindow } from "./time-window-modal";
import {
  Compass,
  Edit2,
  MapPin,
  Navigation,
  ShieldCheck,
  Truck,
  Warehouse,
  Weight,
} from "lucide-react";

interface Props {
  selectedVehicle: DeliveryVehicle;
  totalWeightKg: number;
  totalVolumeM3: number;
  city: string;
  address: string;
  deliveryWindow?: DeliveryWindow;
  onOpenWindowModal?: () => void;
}

export function DeliveryDispatchRoute({
  selectedVehicle,
  totalWeightKg,
  city,
  address,
  deliveryWindow,
  onOpenWindowModal,
}: Props) {
  const [viewMode, setViewMode] = useState<"photo" | "blueprint">("photo");

  // Вычисляем процент загрузки
  const payloadPercent = Math.min(
    150,
    Math.round((totalWeightKg / selectedVehicle.capacityKg) * 100)
  );
  const isOverweight = totalWeightKg > selectedVehicle.capacityKg;

  // Оценочный километраж и время
  const estimatedKm = city === "Душанбе" ? 18 : city === "Бохтар" ? 92 : city === "Вахш" ? 110 : 85;
  const transitMinutes = Math.round((estimatedKm / 55) * 60);

  const windowTime = deliveryWindow?.timeRange ?? "09:00 – 12:00";
  const windowDay = deliveryWindow?.dayLabel ?? "Сегодня, Вт";

  return (
    <div className="dispatch-hero-container">
      {/* Верхняя статусная строка рейса (как на Скриншоте 1 и 2) */}
      <div className="dispatch-header-row">
        <div className="dispatch-route-title">
          <div className="route-badge-row">
            <span className="route-live-indicator">
              <span className="live-dot" />
              Диспетчерский расчет рейса
            </span>
            <span className="route-tag">{selectedVehicle.codeIndex} · {selectedVehicle.title}</span>
          </div>
          <h2 className="dispatch-h2">
            Душанбе, Складской хаб → {city || "Кушониён"}
          </h2>
          <p className="dispatch-meta-sub">
            Маршрут: Трасса Душанбе — Бохтар · Дистанция: ~{estimatedKm} км · Время в пути: ~
            {transitMinutes} мин · Водитель: <strong>{selectedVehicle.driverName}</strong> ({selectedVehicle.plate})
          </p>
        </div>

        {/* Информационные плашки времени окна (как на Скриншоте 1 и 3) */}
        <div
          className="dispatch-time-boxes"
          onClick={onOpenWindowModal}
          role={onOpenWindowModal ? "button" : undefined}
          tabIndex={onOpenWindowModal ? 0 : undefined}
          title={onOpenWindowModal ? "Нажмите для смены окна доставки" : undefined}
        >
          <div className="time-box time-box-primary">
            <div className="time-header-mini">
              <span className="time-label">Окно подачи</span>
              {onOpenWindowModal && <Edit2 size={11} className="time-edit-icon" />}
            </div>
            <strong className="time-val">{windowTime}</strong>
            <span className="time-sub">{windowDay} · Склад Душанбе</span>
          </div>
          <div className="time-box time-box-accent">
            <span className="time-label">Прибытие на объект</span>
            <strong className="time-val">~{transitMinutes} мин в пути</strong>
            <span className="time-sub">{city || "Кушониён"}</span>
          </div>
        </div>
      </div>

      {/* Центральный визуальный блок: Большая карточка грузовика + характеристики */}
      <div className="dispatch-main-grid">
        {/* Иллюстрация / Реальное фото выбранного грузовика (Скриншот 2) */}
        <div className="dispatch-vehicle-showcase">
          <div className="truck-illustration-wrap">
            {viewMode === "photo" && selectedVehicle.photoUrl ? (
              <div className="truck-photo-stage">
                <Image
                  src={selectedVehicle.photoUrl}
                  alt={selectedVehicle.title}
                  className="truck-photo-hero"
                  width={1200}
                  height={700}
                  unoptimized
                />
                <div className="truck-photo-gradient" />
              </div>
            ) : (
              <TruckArt variant={selectedVehicle.imageVariant} className="truck-canvas" />
            )}

            {/* Переключатель фото / чертеж */}
            <div className="truck-view-toggle">
              <button
                type="button"
                className={`view-btn ${viewMode === "photo" ? "is-active" : ""}`}
                onClick={() => setViewMode("photo")}
              >
                Фото
              </button>
              <button
                type="button"
                className={`view-btn ${viewMode === "blueprint" ? "is-active" : ""}`}
                onClick={() => setViewMode("blueprint")}
              >
                Схема
              </button>
            </div>

            {/* Плашка грузоподъемности над грузовиком */}
            <div className="truck-floating-stat stat-payload">
              <Weight size={14} />
              <span>
                Груз: <strong>{(totalWeightKg / 1000).toFixed(2)} т</strong> /{" "}
                {(selectedVehicle.capacityKg / 1000).toFixed(1)} т
              </span>
            </div>

            {/* Плашка габаритов кузова */}
            <div className="truck-floating-stat stat-dimensions">
              <Navigation size={14} />
              <span>Кузов: {selectedVehicle.dimensions}</span>
            </div>

            {/* Плашка водителя */}
            <div className="truck-floating-stat stat-driver">
              <span className="driver-symbol">{selectedVehicle.driverAvatar}</span>
              <span>{selectedVehicle.driverName} ({selectedVehicle.plate})</span>
            </div>
          </div>

          {/* Индикатор загрузки кузова (шкала вместимости) */}
          <div className="payload-meter-box">
            <div className="meter-label-row">
              <span className="meter-title">
                Загрузка кузова: <strong>{payloadPercent}%</strong>
              </span>
              <span className={`meter-status ${isOverweight ? "is-danger" : "is-ok"}`}>
                {isOverweight ? "⚠️ Перегруз!" : "✓ В пределах нормы"}
              </span>
            </div>
            <div className="meter-bar-track">
              <div
                className={`meter-bar-fill ${isOverweight ? "bar-danger" : payloadPercent > 80 ? "bar-warn" : ""}`}
                style={{ width: `${Math.min(100, payloadPercent)}%` }}
              />
            </div>
            <div className="meter-caption-row">
              <span>0 кг</span>
              <span>
                Фактический вес: <strong>{totalWeightKg.toLocaleString()} кг</strong>
              </span>
              <span>Макс: {selectedVehicle.capacityKg.toLocaleString()} кг</span>
            </div>
          </div>

          {/* Таймлайн путевых точек маршрута (как на Скриншоте 1) */}
          <div className="route-milestones-timeline">
            <div className="milestone-step step-done">
              <div className="milestone-dot">
                <Warehouse size={14} />
              </div>
              <div className="milestone-content">
                <strong>Центральный склад Bizon TJ</strong>
                <span>Душанбе, Промзона (Погрузка)</span>
                <span className="milestone-time">{windowTime.split("–")[0]?.trim() || "09:00"}</span>
              </div>
            </div>

            <div className="milestone-line active" />

            <div className="milestone-step step-active">
              <div className="milestone-dot">
                <Truck size={14} />
              </div>
              <div className="milestone-content">
                <strong>Трасса Душанбе — Бохтар</strong>
                <span>В пути (~{estimatedKm} км)</span>
                <span className="milestone-time">Скорость ~60-70 км/ч</span>
              </div>
            </div>

            <div className="milestone-line" />

            <div className="milestone-step step-target">
              <div className="milestone-dot">
                <MapPin size={14} />
              </div>
              <div className="milestone-content">
                <strong>Объект: {city}</strong>
                <span>{address || "Адрес разгрузки на стройплощадке"}</span>
                <span className="milestone-time">Прибытие: ~{windowTime.split("–")[1]?.trim() || "12:00"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Правый сайдбар: Интерактивная карта и диспетчерская сводка (как на Скриншоте 2) */}
        <aside className="dispatch-side-panel">
          {/* Стилизованная векторная мини-карта Таджикистана с маршрутом */}
          <div className="dispatch-mini-map-card">
            <div className="mini-map-header">
              <span className="mini-map-badge">
                <Compass size={13} /> Карта маршрута
              </span>
              <span className="mini-map-traffic">Дорога свободна</span>
            </div>

            <svg
              viewBox="0 0 320 180"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mini-map-svg"
            >
              {/* Map background grid */}
              <rect width="320" height="180" rx="10" fill="#0F172A" />
              <path
                d="M0 30 H320 M0 70 H320 M0 110 H320 M0 150 H320"
                stroke="#1E293B"
                strokeWidth="1"
              />
              <path
                d="M50 0 V180 M110 0 V180 M170 0 V180 M230 0 V180 M290 0 V180"
                stroke="#1E293B"
                strokeWidth="1"
              />

              {/* Mountains stylized relief */}
              <path
                d="M30 140 L60 80 L90 120 L130 60 L180 130"
                stroke="#334155"
                strokeWidth="1.5"
                fill="none"
                opacity="0.4"
              />

              {/* Highway Route line (Dushanbe -> Kushoniyon) */}
              <path
                d="M70 45 C120 60 140 100 230 135"
                stroke="#3B82F6"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M70 45 C120 60 140 100 230 135"
                stroke="#60A5FA"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="6 4"
                fill="none"
              />

              {/* Start Point: Dushanbe */}
              <circle cx="70" cy="45" r="7" fill="#3B82F6" />
              <circle cx="70" cy="45" r="3" fill="#FFFFFF" />
              <text x="82" y="42" fill="#FFFFFF" fontSize="11" fontWeight="bold">
                Душанбе (Склад)
              </text>

              {/* Moving Vehicle on highway */}
              <circle cx="145" cy="88" r="9" fill="#10B981" opacity="0.3" />
              <circle cx="145" cy="88" r="5" fill="#10B981" />
              <text x="156" y="92" fill="#34D399" fontSize="10" fontWeight="bold">
                Рейс в пути
              </text>

              {/* End Point: Kushoniyon / Bokhtar */}
              <circle cx="230" cy="135" r="7" fill="#EF4444" />
              <circle cx="230" cy="135" r="3" fill="#FFFFFF" />
              <text x="175" y="155" fill="#F87171" fontSize="11" fontWeight="bold">
                {city || "Кушониён"} (Объект)
              </text>
            </svg>
          </div>

          {/* Карточка преимуществ выбранного транспорта */}
          <div className="dispatch-perks-card">
            <h4 className="perks-h4">Особенности машины:</h4>
            <ul className="perks-list">
              {selectedVehicle.features.map((feat, idx) => (
                <li key={idx} className="perk-item">
                  <ShieldCheck size={15} className="perk-icon" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <div className="unloading-spec-pill">
              <span className="unloading-tag-title">Выгрузка:</span>
              <strong className="unloading-tag-value">
                {selectedVehicle.unloadingType === "CRANE_BOOM"
                  ? "Собственный кран-манипулятор"
                  : selectedVehicle.unloadingType === "DUMP"
                    ? "Самосвальный сброс назад"
                    : "Бортовая / ручная выгрузка"}
              </strong>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

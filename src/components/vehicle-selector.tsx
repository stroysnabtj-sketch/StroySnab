"use client";
import { CustomSelect } from "@/components/custom-select";

import React, { useState } from "react";
import Image from "next/image";
import { DELIVERY_FLEET, type DeliveryVehicle } from "@/modules/delivery/fleet-data";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  MapPin,
  Sparkles,
  Zap,
} from "lucide-react";

interface Props {
  selectedVehicleCode: string;
  onSelectVehicle: (vehicle: DeliveryVehicle) => void;
  recommendedCode: string;
  totalWeightKg: number;
}

type FleetTab = "all" | "taxi" | "light" | "special" | "heavy";

export function VehicleSelector({
  selectedVehicleCode,
  onSelectVehicle,
  recommendedCode,
  totalWeightKg,
}: Props) {
  const [activeTab, setActiveTab] = useState<FleetTab>("all");
  const [sortBy, setSortBy] = useState<"recommended" | "capacity" | "price">("recommended");

  // Фильтрация по табам
  const filteredVehicles = DELIVERY_FLEET.filter((veh) => {
    if (activeTab === "all") return true;
    if (activeTab === "taxi") return veh.category === "taxi" || veh.category === "pickup";
    if (activeTab === "light") return veh.category === "light";
    if (activeTab === "special") return veh.category === "special";
    if (activeTab === "heavy") return veh.category === "heavy";
    return true;
  });

  // Сортировка
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    if (sortBy === "capacity") return a.capacityKg - b.capacityKg;
    if (sortBy === "price") return a.basePriceTJS - b.basePriceTJS;
    // По умолчанию: рекомендованная машина идет первой
    if (a.code === recommendedCode) return -1;
    if (b.code === recommendedCode) return 1;
    return a.capacityKg - b.capacityKg;
  });

  return (
    <div className="fleet-dashboard-selector">
      {/* 1. Заголовок секции автопарка */}
      <div className="fleet-header-row">
        <div>
          <div className="fleet-kicker">
            <span className="live-dot" />
            Автопарк доставки Bizon TJ
          </div>
          <h3 className="fleet-title">Выберите транспорт доставки</h3>
          <p className="fleet-subtitle">
            Умный расчет полезной нагрузки под ваш объем стройматериалов:{" "}
            <strong>{(totalWeightKg / 1000).toFixed(2)} т ({totalWeightKg.toLocaleString()} кг)</strong>
          </p>
        </div>

        <div className="fleet-weight-meter-pill">
          <span className="meter-pill-label">Общий вес заказа:</span>
          <span className="meter-pill-value">{(totalWeightKg / 1000).toFixed(2)} т</span>
        </div>
      </div>

      {/* 2. Навигационные табы автопарка (как на Скриншоте 1) */}
      <div className="fleet-toolbar-row">
        <div className="fleet-tabs-group" role="tablist">
          <button
            type="button"
            className={`fleet-tab-btn ${activeTab === "all" ? "is-active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            ✓ Все машины ({DELIVERY_FLEET.length})
          </button>
          <button
            type="button"
            className={`fleet-tab-btn ${activeTab === "taxi" ? "is-active" : ""}`}
            onClick={() => setActiveTab("taxi")}
          >
            Легковые и такси (2)
          </button>
          <button
            type="button"
            className={`fleet-tab-btn ${activeTab === "light" ? "is-active" : ""}`}
            onClick={() => setActiveTab("light")}
          >
            Малый тоннаж (2)
          </button>
          <button
            type="button"
            className={`fleet-tab-btn ${activeTab === "special" ? "is-active" : ""}`}
            onClick={() => setActiveTab("special")}
          >
            Спецтехника (1)
          </button>
          <button
            type="button"
            className={`fleet-tab-btn ${activeTab === "heavy" ? "is-active" : ""}`}
            onClick={() => setActiveTab("heavy")}
          >
            Тяжелые фуры (2)
          </button>
        </div>

        {/* Сортировка справа */}
        <div className="fleet-sort-wrap">
          <span className="sort-caption">Сортировка:</span>
          <CustomSelect
            className="fleet-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "recommended" | "capacity" | "price")}
          >
            <option value="recommended">По рекомендации ИИ</option>
            <option value="capacity">По грузоподъёмности</option>
            <option value="price">По стоимости тарифа</option>
          </CustomSelect>
        </div>
      </div>

      {/* 3. Сетка карточек транспорта (как на Скриншоте 1) */}
      <div className="fleet-cards-grid">
        {sortedVehicles.map((veh) => {
          const isSelected = veh.code === selectedVehicleCode;
          const isRecommended = veh.code === recommendedCode;
          const isOverweight = totalWeightKg > veh.capacityKg;

          // Расчет процента полезной загрузки
          const payloadPercent = Math.min(
            150,
            Math.round((totalWeightKg / veh.capacityKg) * 100)
          );

          return (
            <div
              key={veh.id}
              onClick={() => onSelectVehicle(veh)}
              className={`fleet-card ${isSelected ? "is-selected" : ""} ${
                isRecommended ? "is-recommended" : ""
              } ${isOverweight ? "is-overweight" : ""}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectVehicle(veh);
                }
              }}
            >
              {/* Верхняя фото-область с оверлейными плашками (Скриншот 1) */}
              <div className="fleet-card-media">
                <Image
                  src={veh.photoUrl}
                  alt={veh.title}
                  className="fleet-card-img"
                  width={480}
                  height={260}
                  unoptimized
                />

                {/* Плашка статуса машины (зеленая точка: "В рейсе" / "В парке") */}
                <div className="fleet-overlay-pill pill-status">
                  <span className="status-indicator-dot" />
                  <span>{veh.status === "in_service" ? "В рейсе" : "Свободен"}</span>
                </div>

                {/* Плашка надежности / готовности */}
                <div className="fleet-overlay-pill pill-health">
                  <Zap size={11} />
                  <span>Готовность {veh.fuelPercent}%</span>
                </div>

                {/* Бейдж рекомендации */}
                {isRecommended && (
                  <div className="fleet-overlay-badge badge-recommended">
                    <Sparkles size={12} />
                    <span>Рекомендуемый выбор</span>
                  </div>
                )}

                {/* Бейдж перегруза */}
                {isOverweight && (
                  <div className="fleet-overlay-badge badge-overweight">
                    <AlertTriangle size={12} />
                    <span>Перегруз +{((totalWeightKg - veh.capacityKg) / 1000).toFixed(1)} т</span>
                  </div>
                )}
              </div>

              {/* Тело карточки: Идентификатор + Водитель */}
              <div className="fleet-card-body">
                <div className="fleet-identity-row">
                  <div className="fleet-identity-meta">
                    <div className="fleet-code-line">
                      <span className="fleet-code-badge">{veh.codeIndex}</span>
                      <span className="fleet-plate-text">{veh.plate}</span>
                    </div>
                    <h4 className="fleet-vehicle-title">{veh.title}</h4>
                    <span className="fleet-vehicle-sub">{veh.badge}</span>
                  </div>

                  {/* Аватар водителя */}
                  <div className="fleet-driver-avatar" title={`Водитель: ${veh.driverName}`}>
                    <span className="avatar-symbol">{veh.driverAvatar}</span>
                    <span className="driver-mini-name">{veh.driverName.split(" ")[0]}</span>
                  </div>
                </div>

                {/* 3 колонки метрик (Скриншот 1: Fuel/Payload, Odometer/Capacity, Service/Tariff) */}
                <div className="fleet-metrics-strip">
                  {/* Метрика 1: Загрузка под заказ */}
                  <div className="fleet-metric-col">
                    <span className="metric-label">ЗАГРУЗКА</span>
                    <strong
                      className={`metric-value ${
                        isOverweight ? "text-danger" : payloadPercent > 80 ? "text-warning" : "text-ok"
                      }`}
                    >
                      {payloadPercent}%
                    </strong>
                    <div className="metric-bar-wrap">
                      <div
                        className={`metric-bar-fill ${
                          isOverweight ? "fill-danger" : payloadPercent > 80 ? "fill-warning" : "fill-ok"
                        }`}
                        style={{ width: `${Math.min(100, payloadPercent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Метрика 2: Грузоподъемность и объем */}
                  <div className="fleet-metric-col">
                    <span className="metric-label">ГРУЗОПОДЪЁМНОСТЬ</span>
                    <strong className="metric-value">{veh.capacityFormatted}</strong>
                    <span className="metric-sub">{veh.volumeFormatted}</span>
                  </div>

                  {/* Метрика 3: Базовый тариф */}
                  <div className="fleet-metric-col">
                    <span className="metric-label">ТАРИФ ДОСТАВКИ</span>
                    <strong className="metric-value">
                      {veh.basePriceTJS === 0 ? "Бесплатно" : `${veh.basePriceTJS} TJS`}
                    </strong>
                    <span className="metric-sub">
                      {veh.pricePerKmTJS > 0 ? `+${veh.pricePerKmTJS} TJS/км` : "0 TJS"}
                    </span>
                  </div>
                </div>

                {/* Нижняя строка: Маршрут и подача + Кнопка выбора */}
                <div className="fleet-card-footer">
                  <div className="fleet-footer-location">
                    <MapPin size={13} className="loc-pin-icon" />
                    <span className="loc-text">
                      Подача: <strong>~{veh.dispatchTimeMins} мин</strong> (из Душанбе)
                    </span>
                  </div>

                  <div className="fleet-select-btn-wrap">
                    {isSelected ? (
                      <span className="fleet-selected-tag">
                        <Check size={14} /> Выбрано
                      </span>
                    ) : (
                      <span className="fleet-choose-link">
                        Выбрать <ChevronRight size={14} />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

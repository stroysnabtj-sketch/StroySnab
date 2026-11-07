"use client";
import Image from "next/image";
import { useState } from "react";
import { Check, Package, Truck, Weight } from "lucide-react";
import { VEHICLE_OPTIONS, type VehicleCode } from "@/modules/delivery/preferences";
import styles from "./delivery-selection.module.css";
export function DeliveryVehiclePicker({
  value,
  onChange,
  weightKg,
}: {
  value: VehicleCode;
  onChange: (value: VehicleCode) => void;
  weightKg?: number | null;
}) {
  const [tab, setTab] = useState("all");
  const tabs = [
    ["all", "Все машины"],
    ["light", "Малый тоннаж"],
    ["heavy", "Тяжёлые грузы"],
    ["special", "Спецтехника"],
  ];
  const shown = VEHICLE_OPTIONS.filter(
    (vehicle) =>
      tab === "all" ||
      (tab === "light" ? ["taxi", "light"].includes(vehicle.category) : vehicle.category === tab),
  );
  const suggested = weightKg
    ? [...VEHICLE_OPTIONS]
        .sort((a, b) => a.capacityKg - b.capacityKg)
        .find((vehicle) => vehicle.capacityKg >= weightKg)?.code
    : undefined;
  return (
    <section className={styles.fleet}>
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>Транспорт доставки</span>
          <h2>Выберите машину</h2>
        </div>
        <Truck size={24} />
      </div>
      <p className={styles.description}>
        Выбранный тип передадим логисту. Машину и стоимость подтвердим при согласовании заказа.
      </p>
      <div className={styles.tabs} aria-label="Категории транспорта">
        {tabs.map(([key, label]) => (
          <button key={key} type="button" aria-pressed={tab === key} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>
      <fieldset className={styles.grid}>
        <legend className="sr-only">Тип машины для доставки</legend>
        {shown.map((vehicle) => (
          <label
            key={vehicle.code}
            className={styles.vehicle}
            data-selected={value === vehicle.code}
          >
            <input
              type="radio"
              name="delivery-vehicle"
              value={vehicle.code}
              checked={value === vehicle.code}
              onChange={() => onChange(vehicle.code)}
            />
            <div className={styles.photo}>
              <Image
                src={vehicle.photoUrl}
                alt={vehicle.title}
                fill
                sizes="(max-width: 600px) 50vw, 33vw"
              />
              {value === vehicle.code && (
                <span className={styles.selected}>
                  <Check size={13} />
                  Выбрано
                </span>
              )}
            </div>
            <div className={styles.vehicleBody}>
              <h3>{vehicle.title}</h3>
              <div className={styles.metrics}>
                <span>
                  <Weight size={13} />
                  {vehicle.capacityKg.toLocaleString("ru")} кг
                </span>
                <span>
                  <Package size={13} />
                  {vehicle.volumeM3} м³
                </span>
              </div>
              <small>{vehicle.dimensions}</small>
              {suggested === vehicle.code && (
                <span className={styles.match}>Подходит по массе</span>
              )}
              {weightKg && vehicle.capacityKg < weightKg ? (
                <span className={styles.warning}>Потребуется согласование нагрузки</span>
              ) : null}
            </div>
          </label>
        ))}
      </fieldset>
    </section>
  );
}

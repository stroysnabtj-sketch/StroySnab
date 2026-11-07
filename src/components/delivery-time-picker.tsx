"use client";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, Check, X } from "lucide-react";
import {
  deliveryToday,
  deliveryDateLabel,
  TIME_SLOTS,
  type DeliveryTimeSlot,
} from "@/modules/delivery/preferences";
import styles from "./delivery-selection.module.css";
export function DeliveryTimePicker({
  date,
  slot,
  onChange,
}: {
  date: string;
  slot: DeliveryTimeSlot | "";
  onChange: (date: string, slot: DeliveryTimeSlot | "") => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftDate, setDate] = useState(date);
  const [draftSlot, setSlot] = useState<DeliveryTimeSlot>(slot || "MORNING");
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !ref.current?.open) ref.current?.showModal();
    else if (!open && ref.current?.open) ref.current.close();
  }, [open]);
  const apply = () => {
    if (!draftDate || draftDate < deliveryToday()) return;
    onChange(draftDate, draftSlot);
    setOpen(false);
  };
  return (
    <>
      <div className={styles.timeSummary}>
        <CalendarDays size={21} />
        <div>
          <strong>Желаемое время</strong>
          <p>
            {date
              ? `${deliveryDateLabel(date)} · ${slot ? TIME_SLOTS[slot] : "интервал уточняется"}`
              : "Дата и интервал пока не выбраны"}
          </p>
        </div>
        <button
          className="button button-secondary"
          type="button"
          onClick={() => {
            setDate(date || deliveryToday());
            setSlot(slot || "MORNING");
            setOpen(true);
          }}
        >
          {date ? "Изменить" : "Выбрать"}
        </button>
      </div>
      <dialog
        ref={ref}
        className={styles.dialog}
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            apply();
          }
        }}
      >
        <header>
          <div>
            <span className={styles.eyebrow}>Планирование доставки</span>
            <h2>Когда привезти заказ?</h2>
          </div>
          <button type="button" aria-label="Закрыть выбор времени" onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </header>
        <p>
          Укажите удобный день и интервал. Точное время подтвердим после согласования транспорта.
        </p>
        <label className="field">
          Дата доставки
          <input
            className="input"
            type="date"
            min={deliveryToday()}
            value={draftDate}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
        <fieldset className={styles.slots}>
          <legend>Удобный интервал</legend>
          {(Object.entries(TIME_SLOTS) as [DeliveryTimeSlot, string][]).map(([key, label]) => (
            <label key={key} data-selected={draftSlot === key}>
              <input
                type="radio"
                name="delivery-time"
                value={key}
                checked={draftSlot === key}
                onChange={() => setSlot(key)}
              />
              <span>{key === "MORNING" ? "Утро" : key === "AFTERNOON" ? "День" : "Вечер"}</span>
              <strong>{label}</strong>
              {draftSlot === key && <Check size={17} />}
            </label>
          ))}
        </fieldset>
        <footer>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              onChange("", "");
              setOpen(false);
            }}
          >
            Согласовать позже
          </button>
          <button
            type="button"
            className="button button-primary"
            disabled={!draftDate || draftDate < deliveryToday()}
            onClick={apply}
          >
            Сохранить время
          </button>
        </footer>
      </dialog>
    </>
  );
}

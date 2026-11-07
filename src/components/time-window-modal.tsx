"use client";

import React, { useState } from "react";
import { Check, X } from "lucide-react";

export interface DeliveryWindow {
  id: string;
  dayLabel: string;
  timeRange: string;
  isBest?: boolean;
  notes: string;
}

export const DELIVERY_WINDOWS: DeliveryWindow[] = [
  {
    id: "win-today-morning",
    dayLabel: "Сегодня, Вт",
    timeRange: "09:00 – 12:00",
    isBest: true,
    notes: "Утренний рейс, свободная трасса Душанбе — Бохтар",
  },
  {
    id: "win-today-afternoon",
    dayLabel: "Сегодня, Вт",
    timeRange: "13:00 – 16:00",
    notes: "Дневной интервал, стандартная подача к объекту",
  },
  {
    id: "win-today-evening",
    dayLabel: "Сегодня, Вт",
    timeRange: "17:00 – 20:00",
    notes: "Вечерний рейс под окончание рабочей смены",
  },
  {
    id: "win-tomorrow-morning",
    dayLabel: "Завтра, Ср",
    timeRange: "08:00 – 11:00",
    notes: "Ранняя доставка к началу утренних работ на стройке",
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  vehicleTitle: string;
  vehicleCodeIndex: string;
  currentWindowId: string;
  onSelectWindow: (window: DeliveryWindow, extraCheckboxes: { needLoaderHelp: boolean; checkAccessRoad: boolean }) => void;
}

export function TimeWindowModal({
  isOpen,
  onClose,
  vehicleTitle,
  vehicleCodeIndex,
  currentWindowId,
  onSelectWindow,
}: Props) {
  const [selectedId, setSelectedId] = useState(currentWindowId || "win-today-morning");
  const [needLoaderHelp, setNeedLoaderHelp] = useState(false);
  const [checkAccessRoad, setCheckAccessRoad] = useState(true);

  if (!isOpen) return null;

  const currentWindow =
    DELIVERY_WINDOWS.find((w) => w.id === selectedId) || DELIVERY_WINDOWS[0];

  const handleConfirm = () => {
    onSelectWindow(currentWindow, { needLoaderHelp, checkAccessRoad });
    onClose();
  };

  return (
    <div className="time-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="time-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="time-modal-header">
          <div>
            <div className="time-modal-kicker">
              <span className="dot-pulse" />
              Диспетчерский терминал Bizon TJ
            </div>
            <h3 className="time-modal-title">
              Выбор окна доставки для {vehicleCodeIndex} ({vehicleTitle})
            </h3>
            <p className="time-modal-subtitle">
              Выберите гарантированное окно подачи транспорта на объект заказчика
            </p>
          </div>
          <button
            type="button"
            className="time-modal-close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        {/* Info pills */}
        <div className="time-modal-meta-row">
          <div className="meta-pill">
            <span className="meta-lbl">Услуга:</span>
            <strong>Доставка стройматериалов</strong>
          </div>
          <div className="meta-pill">
            <span className="meta-lbl">Склад отправления:</span>
            <strong>Центральный хаб Душанбе</strong>
          </div>
        </div>

        {/* Windows cards list */}
        <div className="time-windows-section">
          <span className="section-label">Выберите окно (Pick a window):</span>
          <div className="time-window-cards-grid">
            {DELIVERY_WINDOWS.map((win) => {
              const isSelected = win.id === selectedId;
              return (
                <div
                  key={win.id}
                  onClick={() => setSelectedId(win.id)}
                  className={`window-card ${isSelected ? "is-active" : ""}`}
                >
                  <div className="window-card-top">
                    <span className="window-day">{win.dayLabel}</span>
                    {win.isBest && <span className="window-best-pill">Рекомендуем</span>}
                  </div>
                  <strong className="window-time">{win.timeRange}</strong>
                  <p className="window-notes">{win.notes}</p>
                  <div className="window-select-indicator">
                    {isSelected ? (
                      <span className="indicator-checked">
                        <Check size={14} /> Выбрано
                      </span>
                    ) : (
                      <span className="indicator-hint">Выбрать</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Extra options */}
        <div className="time-modal-extras">
          <span className="section-label">Дополнительные опции рейса:</span>
          <label className="checkbox-option-card">
            <input
              type="checkbox"
              checked={needLoaderHelp}
              onChange={(e) => setNeedLoaderHelp(e.target.checked)}
            />
            <div className="opt-text">
              <strong>Помощь водителя / ручная выгрузка стройматериалов</strong>
              <span>Помощь водителя в разгрузке кузова у борта машины</span>
            </div>
          </label>

          <label className="checkbox-option-card">
            <input
              type="checkbox"
              checked={checkAccessRoad}
              onChange={(e) => setCheckAccessRoad(e.target.checked)}
            />
            <div className="opt-text">
              <strong>Согласовать подъездные пути для грузовика</strong>
              <span>Диспетчер свяжется с прорабом для уточнения ширины ворот и дороги</span>
            </div>
          </label>
        </div>

        {/* Footer actions */}
        <div className="time-modal-footer">
          <button
            type="button"
            className="button button-secondary modal-cancel-btn"
            onClick={onClose}
          >
            Отмена
          </button>
          <button
            type="button"
            className="button button-primary modal-confirm-btn"
            onClick={handleConfirm}
          >
            Подтвердить {currentWindow.dayLabel}, {currentWindow.timeRange}
          </button>
        </div>
      </div>
    </div>
  );
}


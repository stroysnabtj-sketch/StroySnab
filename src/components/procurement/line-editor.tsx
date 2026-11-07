"use client";
import { LinePhotos } from "./line-photos";
import type { Line } from "./shared";
import { OfferPicker } from "./offer-picker";
import s from "./procurement.module.css";
export type EditableLine = Line & { price?: string };
export const blankLine = (): EditableLine => ({
  id: crypto.randomUUID(),
  name: "",
  qty: "1",
  unit: "шт.",
});
export function LineEditor({
  lines,
  onChange,
  prices = false,
  disabled = false,
  requestId,
  onPhotoBusy,
  onPhotoError,
}: {
  lines: EditableLine[];
  onChange: (lines: EditableLine[]) => void;
  prices?: boolean;
  disabled?: boolean;
  requestId?: string;
  onPhotoBusy?: (busy: boolean) => void;
  onPhotoError?: (error: string) => void;
}) {
  const update = (i: number, key: keyof EditableLine, value: string) =>
    onChange(lines.map((line, index) => (index === i ? { ...line, [key]: value } : line)));
  return (
    <>
      <div>
        {lines.map((line, i) => (
          <div className={`${s.line} ${prices ? s.quoteLine : ""}`} key={i}>
            <label className={s.field}>
              Материал {i + 1}
              <input
                required={prices}
                minLength={2}
                maxLength={300}
                value={line.name}
                disabled={disabled}
                onChange={(e) => update(i, "name", e.target.value)}
                placeholder="Например, цемент М500"
              />
            </label>
            <label className={s.field}>
              Кол-во
              <input
                required
                inputMode="decimal"
                pattern="[0-9]+([.,][0-9]{1,3})?"
                value={line.qty}
                disabled={disabled}
                onChange={(e) => update(i, "qty", e.target.value)}
              />
            </label>
            <label className={s.field}>
              Ед.
              <input
                required
                maxLength={30}
                value={line.unit}
                disabled={disabled}
                onChange={(e) => update(i, "unit", e.target.value)}
              />
            </label>
            {prices && (
              <label className={s.field}>
                Цена, сомони
                <input
                  required
                  inputMode="decimal"
                  value={line.price ?? ""}
                  disabled={disabled}
                  onChange={(e) => update(i, "price", e.target.value)}
                />
              </label>
            )}
            <button
              type="button"
              className={s.remove}
              aria-label={`Удалить позицию ${i + 1}`}
              disabled={disabled || lines.length === 1}
              onClick={() => onChange(lines.filter((_, n) => n !== i))}
            >
              ×
            </button>
            {prices && requestId && (
              <div className={s.offer}>
                <LinePhotos
                  requestId={requestId}
                  images={line.imageIds ?? []}
                  disabled={disabled}
                  onBusy={onPhotoBusy}
                  onError={onPhotoError}
                  onChange={(images) =>
                    onChange(
                      lines.map((value, index) =>
                        index === i ? { ...value, imageIds: images } : value,
                      ),
                    )
                  }
                />
              </div>
            )}
            {prices && (
              <div className={s.offer}>
                <OfferPicker
                  line={line}
                  disabled={disabled}
                  onSelect={(value) => onChange(lines.map((l, index) => (index === i ? value : l)))}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className={s.actions}>
        <button
          type="button"
          className="button button-secondary"
          disabled={disabled || lines.length >= 200}
          onClick={() => onChange([...lines, blankLine()])}
        >
          + Добавить позицию
        </button>
        <span className={s.hint}>{lines.length} из 200 позиций</span>
      </div>
    </>
  );
}

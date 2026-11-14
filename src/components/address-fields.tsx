"use client";
import { useLocale } from "@/i18n/provider";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AddressMap, type MapPoint } from "./address-map";
import { Select, Input, Field, Button } from "./ui";
import type { SavedAddress } from "@/modules/account/addresses";
import styles from "./address-fields.module.css";
export type AddressValue = { city: string; street: string; point: MapPoint | null };
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || "Не удалось сохранить адрес");
  return result;
}
export function AddressFields({
  value,
  onChange,
  canSave = false,
  manage = false,
  requireStreet = true,
  children,
}: {
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  canSave?: boolean;
  manage?: boolean;
  requireStreet?: boolean;
  children?: ReactNode;
}) {
  const { tr } = useLocale();
  const [items, setItems] = useState<SavedAddress[]>([]),
    [locating, setLocating] = useState(false),
    [lookupFailed, setLookupFailed] = useState(false),
    [manual, setManual] = useState(false),
    [selected, setSelected] = useState(""),
    [label, setLabel] = useState(tr("Адрес")),
    [primary, setPrimary] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const manualId = useId();
  const current = useRef(value),
    change = useRef(onChange);
  current.current = value;
  change.current = onChange;
  useEffect(() => {
    if (!canSave) return;
    let active = true;
    void api<{ items: SavedAddress[] }>("/api/account/addresses", { cache: "no-store" })
      .then((data) => {
        if (!active) return;
        setItems(data.items);
        const first = data.items.find((v) => v.isDefault);
        if (first && !current.current.street) {
          setSelected(first.id);
          setLabel(first.label);
          setPrimary(first.isDefault);
          setManual(first.lat === null || first.lng === null);
          change.current({
            city: first.city,
            street: first.street,
            point:
              first.lat !== null && first.lng !== null ? { lat: first.lat, lng: first.lng } : null,
          });
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [canSave]);
  const latitude = value.point?.lat;
  const longitude = value.point?.lng;
  useEffect(() => {
    if (manual || latitude === undefined || longitude === undefined || current.current.street)
      return;
    const controller = new AbortController();
    const point = { lat: latitude, lng: longitude };
    const timer = setTimeout(() => {
      setLocating(true);
      setLookupFailed(false);
      void api<{ city: string; street: string }>(
        `/api/public/address/reverse?lat=${point.lat}&lng=${point.lng}`,
        { signal: controller.signal },
      )
        .then((address) => {
          if (
            !controller.signal.aborted &&
            current.current.point?.lat === point.lat &&
            current.current.point?.lng === point.lng
          ) {
            change.current({ ...current.current, city: address.city, street: address.street });
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) setLookupFailed(true);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLocating(false);
        });
    }, 700);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [latitude, longitude, manual]);
  function choose(id: string) {
    setSelected(id);
    setMessage("");
    setError("");
    const item = items.find((v) => v.id === id);
    if (item) {
      setLabel(item.label);
      setPrimary(item.isDefault);
      setManual(item.lat === null || item.lng === null);
      onChange({
        city: item.city,
        street: item.street,
        point: item.lat !== null && item.lng !== null ? { lat: item.lat, lng: item.lng } : null,
      });
    } else {
      setLabel(tr("Адрес"));
      setPrimary(false);
      setManual(false);
      onChange({ city: "", street: "", point: null });
    }
  }
  async function save() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const saved = await api<{ id: string }>("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(manage && selected ? { id: selected } : {}),
          label,
          ...(manage && primary ? { isDefault: true } : {}),
          city: value.city,
          street: value.street,
          ...(value.point ?? {}),
        }),
      });
      const refreshed = (await api<{ items: SavedAddress[] }>("/api/account/addresses")).items;
      setItems(refreshed);
      setPrimary(refreshed.find((item) => item.id === saved.id)?.isDefault ?? false);
      setSelected(saved.id);
      setMessage(tr("Адрес сохранён"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await api("/api/account/addresses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected }),
      });
      setItems((await api<{ items: SavedAddress[] }>("/api/account/addresses")).items);
      choose("");
      setMessage(tr("Адрес удалён"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const saveControls = (
    <div className={styles.save}>
      <Field label={tr("Название адреса")}>
        <Input maxLength={60} value={label} onChange={(e) => setLabel(e.target.value)} />
      </Field>
      <Button
        type="button"
        variant="secondary"
        disabled={
          busy ||
          (!value.point && (value.street.trim().length < 5 || value.city.trim().length < 2)) ||
          !label.trim()
        }
        onClick={() => void save()}
      >
        {busy
          ? tr("Сохраняем…")
          : manage && selected
            ? tr("Сохранить изменения")
            : tr("Сохранить адрес")}
      </Button>
      {manage && selected && (
        <Button type="button" variant="ghost" disabled={busy} onClick={() => void remove()}>
          {tr("Удалить")}
        </Button>
      )}
    </div>
  );
  return (
    <div className={styles.fields}>
      {canSave && items.length > 0 && (
        <Field label={tr("Сохранённые адреса")}>
          <Select
            aria-label={tr("Сохранённые адреса")}
            value={selected}
            onChange={(e) => choose(e.target.value)}
            disabled={busy}
          >
            <option value="">{tr("Новый адрес")}</option>
            {items.map((item) => (
              <option value={item.id} key={item.id}>
                {tr(item.label)} · {item.street || tr("Точка на карте")}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {!manual && (
        <AddressMap
          value={value.point}
          onChange={(point) => {
            if (!manage) setSelected("");
            onChange({ city: "", street: "", point });
          }}
        />
      )}
      {!manual && value.point && (
        <p role="status" className={styles.message}>
          {locating
            ? tr("Определяем адрес…")
            : lookupFailed
              ? tr("Точка выбрана. Адрес можно указать вручную.")
              : [value.city, value.street].filter(Boolean).join(", ") || tr("Точка выбрана")}
        </p>
      )}
      <Button
        type="button"
        variant="secondary"
        className={styles.modeButton}
        aria-expanded={manual}
        aria-controls={manualId}
        onClick={() => {
          setManual(!manual);
          setError("");
          onChange({ ...value, point: manual ? value.point : null });
        }}
      >
        {manual ? tr("Выбрать на карте") : tr("Указать вручную")}
      </Button>
      <div id={manualId} hidden={!manual} className={manual ? styles.two : undefined}>
        {manual && (
          <>
            <Field label={tr("Город или район")}>
              <Input
                required={requireStreet}
                minLength={requireStreet ? 2 : undefined}
                maxLength={100}
                autoComplete="address-level2"
                placeholder={tr("Душанбе")}
                value={value.city}
                onChange={(e) => {
                  if (!manage) setSelected("");
                  onChange({ ...value, city: e.target.value, point: null });
                }}
              />
            </Field>
            <Field label={tr("Адрес доставки")}>
              <Input
                required={requireStreet}
                minLength={requireStreet ? 5 : undefined}
                maxLength={500}
                autoComplete="street-address"
                placeholder={tr("Улица, дом или ориентир")}
                value={value.street}
                onChange={(e) => {
                  if (!manage) setSelected("");
                  onChange({ ...value, street: e.target.value });
                }}
              />
            </Field>
          </>
        )}
      </div>
      {children}
      {manage && (
        <label className="checkbox">
          <input type="checkbox" checked={primary} onChange={(e) => setPrimary(e.target.checked)} />
          <span>{tr("Основной адрес")}</span>
        </label>
      )}
      {canSave &&
        (manage ? (
          saveControls
        ) : (
          <details className={styles.optionalSave}>
            <summary>{tr("Сохранить в профиль")}</summary>
            {saveControls}
          </details>
        ))}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className={styles.message} role="status">
          {message}
        </p>
      )}
    </div>
  );
}
export function AddressBook() {
  const [value, setValue] = useState<AddressValue>({ city: "", street: "", point: null });
  return <AddressFields value={value} onChange={setValue} canSave manage />;
}

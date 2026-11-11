"use client";
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
  const [items, setItems] = useState<SavedAddress[]>([]),
    [manual, setManual] = useState(false),
    [selected, setSelected] = useState(""),
    [label, setLabel] = useState("Адрес"),
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
      setLabel("Адрес");
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
      setMessage("Адрес сохранён");
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
      setMessage("Адрес удалён");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const saveControls = (
    <div className={styles.save}>
      <Field label="Название адреса">
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
        {busy ? "Сохраняем…" : manage && selected ? "Сохранить изменения" : "Сохранить адрес"}
      </Button>
      {manage && selected && (
        <Button type="button" variant="ghost" disabled={busy} onClick={() => void remove()}>
          Удалить
        </Button>
      )}
    </div>
  );
  return (
    <div className={styles.fields}>
      {canSave && items.length > 0 && (
        <Field label="Сохранённые адреса">
          <Select
            aria-label="Сохранённые адреса"
            value={selected}
            onChange={(e) => choose(e.target.value)}
            disabled={busy}
          >
            <option value="">Новый адрес</option>
            {items.map((item) => (
              <option value={item.id} key={item.id}>
                {item.label} · {item.street || "Точка на карте"}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {!manual && (
        <AddressMap value={value.point} onChange={(point) => onChange({ ...value, point })} />
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
          onChange(manual ? { city: "", street: "", point: null } : { ...value, point: null });
        }}
      >
        {manual ? "Выбрать на карте" : "Указать вручную"}
      </Button>
      <div id={manualId} hidden={!manual} className={manual ? styles.two : undefined}>
        {manual && (
          <>
            <Field label="Город или район">
              <Input
                required={requireStreet}
                minLength={requireStreet ? 2 : undefined}
                maxLength={100}
                autoComplete="address-level2"
                value={value.city}
                onChange={(e) => {
                  if (!manage) setSelected("");
                  onChange({ ...value, city: e.target.value, point: null });
                }}
              />
            </Field>
            <Field label="Адрес доставки">
              <Input
                required={requireStreet}
                minLength={requireStreet ? 5 : undefined}
                maxLength={500}
                autoComplete="street-address"
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
          <span>Основной адрес</span>
        </label>
      )}
      {canSave &&
        (manage ? (
          saveControls
        ) : (
          <details className={styles.optionalSave}>
            <summary>Сохранить в профиль</summary>
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

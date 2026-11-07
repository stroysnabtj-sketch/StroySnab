"use client";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { adminRequest, Button, Field, Input } from "@/components/admin-ui";
import styles from "./admin-home-collections-panel.module.css";

type Product = { id: string; name: string; sku: string; status: string };
type Kind = "new" | "sale";
const titles: Record<Kind, string> = { new: "Новинки", sale: "Акции" };

export function AdminHomeCollectionsPanel() {
  const [kind, setKind] = useState<Kind>("sale");
  const [collections, setCollections] = useState<Record<Kind, Product[]>>({ new: [], sale: [] });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [searching, setSearching] = useState(false);
  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await adminRequest<{ items: (Product & { collection: Kind })[] }>(
        "/api/admin/home-collections",
      );
      setCollections({
        new: data.items.filter((item) => item.collection === "new"),
        sale: data.items.filter((item) => item.collection === "sale"),
      });
      setLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить подборки");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  const selected = collections[kind];
  function update(items: Product[]) {
    setCollections((current) => ({ ...current, [kind]: items }));
    setMessage("");
  }
  function move(index: number, direction: number) {
    const items = [...selected];
    [items[index], items[index + direction]] = [items[index + direction], items[index]];
    update(items);
  }
  async function search() {
    setSearching(true);
    setError("");
    try {
      setResults(
        (
          await adminRequest<{ products: Product[] }>(
            `/api/admin/home-collections?q=${encodeURIComponent(query)}`,
          )
        ).products,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка поиска");
    } finally {
      setSearching(false);
    }
  }
  async function save() {
    setPending(true);
    setError("");
    setMessage("");
    try {
      await adminRequest("/api/admin/home-collections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: kind, productIds: selected.map((item) => item.id) }),
      });
      setMessage(`Подборка «${titles[kind]}» сохранена`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setPending(false);
    }
  }
  return (
    <div className={styles.panel}>
      <div className={styles.tabs} aria-label="Подборка">
        {(["sale", "new"] as Kind[]).map((value) => (
          <Button
            key={value}
            variant={kind === value ? "primary" : "secondary"}
            aria-pressed={kind === value}
            disabled={pending}
            onClick={() => {
              setKind(value);
              setMessage("");
            }}
          >
            {titles[value]}
          </Button>
        ))}
      </div>
      {error && (
        <div role="alert">
          {error}{" "}
          {loading === false && (
            <Button variant="secondary" onClick={() => void load()}>
              Загрузить заново
            </Button>
          )}
        </div>
      )}
      {message && <p role="status">{message}</p>}
      {loading ? (
        <p role="status">Загружаем подборки…</p>
      ) : (
        loaded && (
          <>
            <section className={styles.card} aria-labelledby="collection-title">
              <h2 id="collection-title">
                {titles[kind]} · {selected.length}/12
              </h2>
              <p className={styles.help}>
                На главной отображаются только опубликованные товары из видимых категорий с
                действующим предложением магазина. Цены берутся из каталога; подборка «Акции» сама
                по себе не создаёт скидку.
              </p>
              {selected.length === 0 && <p>Подборка пуста и не отображается на главной.</p>}
              <ol className={styles.list}>
                {selected.map((item, index) => (
                  <li className={styles.row} key={item.id}>
                    <div className={styles.name}>
                      {index + 1}. {item.name}
                      <small>
                        {item.sku}
                        {item.status !== "PUBLISHED" && " · Не опубликован"}
                      </small>
                    </div>
                    <div className={styles.actions}>
                      <Button
                        variant="secondary"
                        disabled={pending || index === 0}
                        aria-label={`Поднять ${item.name}`}
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUp size={16} />
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={pending || index === selected.length - 1}
                        aria-label={`Опустить ${item.name}`}
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDown size={16} />
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={pending}
                        aria-label={`Убрать ${item.name}`}
                        onClick={() => update(selected.filter((row) => row.id !== item.id))}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </li>
                ))}
              </ol>
              <div>
                <Button disabled={pending} onClick={() => void save()}>
                  {pending ? "Сохраняем…" : `Сохранить «${titles[kind]}»`}
                </Button>
              </div>
            </section>
            <section className={styles.card} aria-label="Добавление товаров">
              <form
                className={styles.search}
                onSubmit={(event) => {
                  event.preventDefault();
                  void search();
                }}
              >
                <Field label="Найти товар по названию или артикулу">
                  <Input
                    value={query}
                    maxLength={120}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </Field>
                <Button type="submit" variant="secondary" disabled={searching}>
                  {searching ? "Ищем…" : "Найти товары"}
                </Button>
              </form>
              <ul className={styles.list}>
                {results.map((item) => (
                  <li key={item.id} className={styles.row}>
                    <div className={styles.name}>
                      {item.name}
                      <small>{item.sku}</small>
                    </div>
                    <Button
                      variant="secondary"
                      disabled={
                        pending ||
                        selected.length >= 12 ||
                        selected.some((row) => row.id === item.id)
                      }
                      onClick={() => update([...selected, item])}
                    >
                      {selected.some((row) => row.id === item.id) ? "Добавлен" : "Добавить"}
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )
      )}
    </div>
  );
}

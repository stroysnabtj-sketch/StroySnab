"use client";
import { CustomSelect } from "@/components/custom-select";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CategoryPicker } from "@/components/category-picker";
import {
  getProductAttributeFields,
  getRelevantProductAttributes,
} from "@/modules/catalog/categories-data";
import type { getShopProduct } from "@/modules/suppliers/shop-service";
import styles from "./seller-workspace.module.css";
type Product = Awaited<ReturnType<typeof getShopProduct>>;
type Category = { id: string; slug: string; nameRu: string; parentId: string | null };
const statusNames: Record<string, string> = {
  PENDING: "На модерации",
  ACTIVE: "Опубликован",
  DRAFT: "Черновик",
  REJECTED: "Отклонён",
  ARCHIVED: "Архив",
};
export function SellerProductEditor({
  initial,
  categories,
}: {
  initial?: Product;
  categories: Category[];
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(initial);
  const [nameRu, setName] = useState(initial?.product.nameRu ?? "");
  const [categoryId, setCategory] = useState(initial?.product.categoryId ?? "");
  const [brand, setBrand] = useState(initial?.product.brand ?? "");
  const [unit, setUnit] = useState(initial?.product.unit ?? "шт.");
  const [descriptionRu, setDescription] = useState(initial?.product.descriptionRu ?? "");
  const [attributes, setAttributes] = useState<Record<string, string>>(
    Object.fromEntries(initial?.attributes.map((a) => [a.name, a.value]) ?? []),
  );
  const [price, setPrice] = useState(
    initial?.offer
      ? `${BigInt(initial.offer.supplierPriceDirams) / 100n}.${(BigInt(initial.offer.supplierPriceDirams) % 100n).toString().padStart(2, "0")}`
      : "",
  );
  const [stockQty, setStock] = useState(initial?.offer?.stockQty ?? "0");
  const [minOrderQty, setMinimum] = useState(initial?.offer?.minOrderQty ?? "1");
  const [leadTimeDays, setLeadTime] = useState(initial?.offer?.leadTimeDays ?? 1);
  const [active, setActive] = useState(initial?.offer?.isActive !== "false");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [contentDirty, setContentDirty] = useState(false);
  const canEdit = !current || current.canEditProduct;
  const fields = getProductAttributeFields(
    categories.find((c) => c.id === categoryId)?.slug,
    attributes,
  );
  function changeAttribute(key: string, label: string, value: string) {
    changeContent(() =>
      setAttributes((old) => {
        const next = { ...old };
        if (label !== key) delete next[label];
        next[key] = value;
        return next;
      }),
    );
  }
  function changeContent(action: () => void) {
    action();
    setContentDirty(true);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    const normalized = price.trim().replace(",", ".");
    if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
      setError("Укажите цену в сомони, до двух знаков после запятой");
      return;
    }
    const [whole, cents = ""] = normalized.split(".");
    const supplierPriceDirams = (BigInt(whole) * 100n + BigInt(cents.padEnd(2, "0"))).toString();
    const payload = {
      ...((!current || contentDirty) && canEdit
        ? {
            product: {
              nameRu,
              categoryId,
              brand,
              unit,
              descriptionRu,
              attributes: Object.entries(
                getRelevantProductAttributes(
                  categories.find((c) => c.id === categoryId)?.slug,
                  attributes,
                ),
              )
                .filter(([, v]) => v.trim())
                .map(([name, value]) => ({ name, value })),
            },
          }
        : {}),
      offer: {
        supplierPriceDirams,
        stockQty,
        minOrderQty,
        leadTimeDays,
        isActive: active ? "true" : "false",
      },
    };
    setBusy(true);
    try {
      const response = await fetch(
        current ? `/api/seller/products/${current.product.id}` : "/api/seller/products",
        {
          method: current ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Не удалось сохранить товар");
      setCurrent(data);
      setContentDirty(false);
      setMessage(
        payload.product
          ? "Карточка отправлена на модерацию. Условия продажи сохранены."
          : "Условия продажи сохранены.",
      );
      if (!current) router.replace(`/seller/products/${data.product.id}`);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Не удалось связаться с сервером. Повторите сохранение.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function upload(file?: File) {
    if (!file || !current) return;
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`/api/seller/products/${current.product.id}/images`, {
        method: "POST",
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Не удалось загрузить фото");
      setCurrent({
        ...current,
        product: { ...current.product, status: "PENDING" },
        images: [...current.images, data],
      });
      setMessage("Фото добавлено. Карточка отправлена на модерацию.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить фото");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={styles.root}>
      <div className={styles.heading}>
        <div>
          <Link href="/seller/products" className={styles.link}>
            ← Товары магазина
          </Link>
          <h1>{current ? "Редактирование товара" : "Новый товар"}</h1>
          <p>
            {current
              ? (statusNames[current.product.status] ?? current.product.status)
              : "Заполните карточку и условия продажи"}
          </p>
        </div>
      </div>
      {error && (
        <div role="alert" className={`${styles.notice} ${styles.error}`}>
          {error}
        </div>
      )}
      {message && (
        <div role="status" className={styles.notice}>
          {message}
        </div>
      )}
      {current?.product.rejectReason && (
        <div className={`${styles.notice} ${styles.error}`}>
          Причина отклонения: {current.product.rejectReason}
        </div>
      )}
      <form className={styles.root} onSubmit={save}>
        <section className={styles.panel}>
          <h2>Карточка товара</h2>
          <p className={styles.muted}>
            {canEdit
              ? "Новые карточки и изменения описания публикуются после проверки платформой."
              : "Общую карточку редактирует платформа. Ниже доступны ваши цена и остаток."}
          </p>
          <fieldset
            disabled={!canEdit || busy}
            style={{ border: 0, padding: 0, margin: "20px 0 0" }}
          >
            <div className={styles.grid}>
              <label className={`${styles.field} ${styles.full}`}>
                Название
                <input
                  required
                  maxLength={250}
                  value={nameRu}
                  onChange={(e) => changeContent(() => setName(e.target.value))}
                />
              </label>
              <div className={styles.full}>
                <CategoryPicker
                  categories={categories}
                  value={categoryId}
                  onChange={(value) =>
                    changeContent(() => {
                      setCategory(value);
                      setAttributes({});
                    })
                  }
                />
              </div>
              <label className={styles.field}>
                Единица продажи
                <input
                  required
                  maxLength={30}
                  value={unit}
                  onChange={(e) => changeContent(() => setUnit(e.target.value))}
                  placeholder="шт., м², мешок"
                />
              </label>
              <label className={styles.field}>
                Бренд
                <input
                  maxLength={150}
                  value={brand}
                  onChange={(e) => changeContent(() => setBrand(e.target.value))}
                />
              </label>
              <label className={`${styles.field} ${styles.full}`}>
                Описание
                <textarea
                  maxLength={10000}
                  value={descriptionRu}
                  onChange={(e) => changeContent(() => setDescription(e.target.value))}
                />
              </label>
              {fields.map((f) => (
                <label className={styles.field} key={f.key}>
                  {f.label}
                  {f.unit ? `, ${f.unit}` : ""}
                  {f.type === "boolean" ? (
                    <CustomSelect
                      value={
                        ({ true: "Да", false: "Нет" } as Record<string, string>)[
                          attributes[f.key] ?? attributes[f.label] ?? ""
                        ] ??
                        attributes[f.key] ??
                        attributes[f.label] ??
                        ""
                      }
                      onChange={(e) => changeAttribute(f.key, f.label, e.target.value)}
                    >
                      <option value="">Не указано</option>
                      <option value="Да">Да</option>
                      <option value="Нет">Нет</option>
                    </CustomSelect>
                  ) : f.options?.length ? (
                    <CustomSelect
                      value={attributes[f.key] ?? attributes[f.label] ?? ""}
                      onChange={(e) => changeAttribute(f.key, f.label, e.target.value)}
                    >
                      <option value="">Не указано</option>
                      {f.options.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </CustomSelect>
                  ) : (
                    <input
                      type={
                        f.type === "range" &&
                        /^-?\d*(?:[.,]\d+)?$/.test(attributes[f.key] ?? attributes[f.label] ?? "")
                          ? "number"
                          : "text"
                      }
                      step={f.type === "range" ? "any" : undefined}
                      maxLength={500}
                      inputMode={f.type === "range" ? "decimal" : "text"}
                      value={attributes[f.key] ?? attributes[f.label] ?? ""}
                      onChange={(e) => changeAttribute(f.key, f.label, e.target.value)}
                    />
                  )}
                </label>
              ))}
            </div>
          </fieldset>
        </section>
        <section className={styles.panel}>
          <h2>Ваши условия продажи</h2>
          <div className={styles.grid}>
            <label className={styles.field}>
              Цена магазина, TJS
              <input
                required
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={busy}
              />
            </label>
            <label className={styles.field}>
              Остаток, {unit}
              <input
                required
                inputMode="decimal"
                value={stockQty}
                onChange={(e) => setStock(e.target.value)}
                disabled={busy}
              />
            </label>
            <label className={styles.field}>
              Минимальное количество
              <input
                required
                inputMode="decimal"
                value={minOrderQty}
                onChange={(e) => setMinimum(e.target.value)}
                disabled={busy}
              />
            </label>
            <label className={styles.field}>
              Срок подготовки, дней
              <input
                required
                type="number"
                min={0}
                max={365}
                value={leadTimeDays}
                onChange={(e) => setLeadTime(Number(e.target.value))}
                disabled={busy}
              />
            </label>
            <label className={styles.field}>
              Продажа
              <CustomSelect
                value={active ? "true" : "false"}
                onChange={(e) => setActive(e.target.value === "true")}
                disabled={busy}
              >
                <option value="true">Включена</option>
                <option value="false">Приостановлена</option>
              </CustomSelect>
            </label>
            <p className={styles.muted}>
              Цена до наценки платформы. Зарезервировано: {current?.offer?.reservedQty ?? "0"}{" "}
              {unit}.
            </p>
          </div>
        </section>
        <div className={styles.actions}>
          <button type="submit" disabled={busy} className={styles.button}>
            {busy
              ? "Сохранение…"
              : !current || contentDirty
                ? "Сохранить и отправить на проверку"
                : "Сохранить условия"}
          </button>
          <Link href="/seller/products" className={`${styles.button} ${styles.secondary}`}>
            К списку товаров
          </Link>
        </div>
      </form>
      <section className={styles.panel}>
        <h2>Фотографии</h2>
        {current ? (
          <>
            <div className={styles.images}>
              {current.images.map((image) => (
                <Image
                  key={image.id}
                  src={image.url}
                  alt={nameRu}
                  width={100}
                  height={100}
                  unoptimized
                />
              ))}
            </div>
            {canEdit && (
              <label className={styles.field}>
                Добавить фото
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={busy || current.images.length >= 10}
                  onChange={(e) => {
                    void upload(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                <span className={styles.muted}>JPEG, PNG или WebP, до 5 МБ. До 10 фото.</span>
              </label>
            )}
          </>
        ) : (
          <p className={styles.muted}>Сначала сохраните товар, затем добавьте фотографии.</p>
        )}
      </section>
    </div>
  );
}

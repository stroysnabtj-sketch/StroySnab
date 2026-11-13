"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  DataTable,
  Field,
  Input,
  Modal,
  Pagination,
  Select,
  Textarea,
  Toast,
} from "@/components/admin-ui";
import { ResourceState } from "@/components/admin-ui";
import { PRODUCT_STATUS_LABELS } from "@/modules/system/admin-labels";
import { useSearchParams } from "next/navigation";
import { CategoryPicker } from "@/components/category-picker";
import {
  getSmartFiltersForCategory,
  getProductAttributeFields,
  getRelevantProductAttributes,
} from "@/modules/catalog/categories-data";
type Category = {
  id: string;
  parentId: string | null;
  slug: string;
  nameRu: string;
  isActive: string;
};
type Product = {
  id: string;
  sku: string;
  slug: string;
  nameRu: string;
  categoryId: string;
  categoryName: string;
  brand: string | null;
  unit: string;
  markupPercent: string;
  status: string;
  descriptionRu: string | null;
  createdBySupplierId: string | null;
  rejectReason?: string | null;
  offerCount: number;
  supplierNames: string[];
};
const blank = {
  sku: "",
  slug: "",
  nameRu: "",
  categoryId: "",
  brand: "",
  unit: "шт.",
  markupPercent: "7",
  status: "DRAFT",
  descriptionRu: "",
  rejectReason: "",
  attributes: "",
};
export function AdminCatalogPanel() {
  const params = useSearchParams();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const loadSequence = useRef(0);
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(blank);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [attributesLoading, setAttributesLoading] = useState(false);
  const editRequest = useRef(0);

  const attributeMap = Object.fromEntries(
    form.attributes
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [key, ...rest] = line.split(":");
        return [key.trim(), rest.join(":").trim()];
      }),
  );
  const attributeFields = getProductAttributeFields(
    categories.find((category) => category.id === form.categoryId)?.slug,
    attributeMap,
  );
  const unknownAttributes = Object.entries(attributeMap)
    .filter(
      ([name]) =>
        !getSmartFiltersForCategory(
          categories.find((category) => category.id === form.categoryId)?.slug,
        ).some((field) => field.key === name || field.label === name),
    )
    .map(([name, value]) => `${name}: ${value}`)
    .join("\n");
  function setAttribute(name: string, value: string) {
    const next = { ...attributeMap };
    const definition = attributeFields.find((field) => field.key === name);
    if (definition && definition.label !== name) delete next[definition.label];
    if (value) next[name] = value;
    else delete next[name];
    setForm((current) => ({
      ...current,
      attributes: Object.entries(next)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n"),
    }));
  }
  const load = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setLoadError("");
    try {
      const query = new URLSearchParams({
        q,
        status,
        categoryId: categoryFilter,
        page: String(page),
        pageSize: "24",
      });
      const [response, cats] = await Promise.all([
        fetch(`/api/admin/catalog/products?${query}`),
        fetch("/api/admin/catalog/categories"),
      ]);
      if (!response.ok || !cats.ok) throw new Error("Не удалось загрузить каталог");
      const data = await response.json(),
        tree = await cats.json();
      if (sequence !== loadSequence.current) return;
      setItems(data.items);
      setTotal(data.total);
      setCategories(tree.items);
    } catch (e) {
      if (sequence === loadSequence.current)
        setLoadError(e instanceof Error ? e.message : "Нет связи с сервером");
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, [q, status, categoryFilter, page]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 150);
    return () => clearTimeout(timer);
  }, [load]);
  async function edit(product: Product) {
    const requestId = ++editRequest.current;
    setEditing(product);
    setError("");
    setAttributesLoading(true);
    setForm({
      sku: product.sku,
      slug: product.slug,
      nameRu: product.nameRu,
      categoryId: product.categoryId,
      brand: product.brand ?? "",
      unit: product.unit,
      markupPercent: product.markupPercent,
      status: product.status,
      descriptionRu: product.descriptionRu ?? "",
      rejectReason: product.rejectReason ?? "",
      attributes: "",
    });
    setOpen(true);
    try {
      const response = await fetch(`/api/admin/catalog/products/${product.id}`);
      if (!response.ok)
        throw new Error("Не удалось загрузить характеристики. Откройте товар повторно.");
      const data = await response.json();
      if (requestId !== editRequest.current) return;
      setForm((current) => ({
        ...current,
        attributes: data.items
          .map((item: { name: string; value: string }) => `${item.name}: ${item.value}`)
          .join("\n"),
      }));
      setAttributesLoading(false);
    } catch (error) {
      if (requestId === editRequest.current)
        setError(error instanceof Error ? error.message : "Не удалось загрузить характеристики");
    }
  }
  async function save() {
    if (attributesLoading) return;
    setPending(true);
    setError("");
    try {
      const payload = {
        ...form,
        brand: form.brand || null,
        descriptionRu: form.descriptionRu || null,
        rejectReason: form.status === "REJECTED" ? form.rejectReason : null,
        attributes: Object.entries(
          getRelevantProductAttributes(
            categories.find((category) => category.id === form.categoryId)?.slug,
            attributeMap,
          ),
        )
          .filter(([, value]) => value.trim())
          .map(([name, value]) => ({ name, value })),
      };
      const response = await fetch(
        editing ? `/api/admin/catalog/products/${editing.id}` : "/api/admin/catalog/products",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Проверьте поля");
      setOpen(false);
      setMessage("Товар сохранён");
      await load();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Не удалось сохранить товар. Повторите попытку.",
      );
    } finally {
      setPending(false);
    }
  }
  async function upload(file: File) {
    if (!editing) return;
    const body = new FormData();
    body.append("file", file);
    const response = await fetch(`/api/admin/catalog/products/${editing.id}/images`, {
      method: "POST",
      body,
    });
    setMessage(
      response.ok ? "Изображение загружено и оптимизировано" : "Не удалось загрузить изображение",
    );
  }
  async function importProducts(dryRun: boolean) {
    if (!importFile) return;
    setPending(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", importFile);
      const response = await fetch(`/api/admin/catalog/products/import?dryRun=${dryRun ? 1 : 0}`, {
        method: "POST",
        body,
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error?.message ?? "Ошибка импорта");
        return;
      }
      setMessage(
        dryRun
          ? `Проверено: ${result.valid} из ${result.total}. Ошибок: ${result.rows.length}`
          : `Импортировано ${result.imported} товаров`,
      );
      if (!dryRun) await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить файл");
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      {error && !open && (
        <p role="alert" className="form-alert">
          {error}
        </p>
      )}
      <div className="panel-toolbar">
        <div className="filters">
          <Input
            value={q}
            onChange={(event) => (setQ(event.target.value), setPage(1))}
            placeholder="Название или SKU"
            aria-label="Поиск товаров"
          />
          <Select
            value={status}
            aria-label="Статус товара"
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Все статусы</option>
            {Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select
            value={categoryFilter}
            aria-label="Категория товаров"
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Все категории</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.nameRu}
              </option>
            ))}
          </Select>
        </div>
        <div className="admin-actions">
          <Link
            className="button button-secondary"
            href="/api/admin/catalog/products/export?format=csv&template=1"
            download
          >
            Шаблон
          </Link>
          <Link
            className="button button-secondary"
            href="/api/admin/catalog/products/export?format=csv"
            download
          >
            CSV
          </Link>
          <Link
            className="button button-secondary"
            href="/api/admin/catalog/products/export?format=xlsx"
            download
          >
            XLSX
          </Link>
          <Button
            onClick={() => {
              editRequest.current++;
              setAttributesLoading(false);
              setError("");
              setEditing(null);
              setForm({ ...blank, categoryId: "" });
              setOpen(true);
            }}
          >
            Добавить товар
          </Button>
        </div>
      </div>
      <div className="import-bar">
        <Input
          type="file"
          accept=".csv,.xlsx"
          onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
          aria-label="Файл импорта"
        />
        <Button
          variant="secondary"
          onClick={() => importProducts(true)}
          disabled={!importFile || pending}
        >
          Проверить файл
        </Button>
        <Button
          variant="secondary"
          onClick={() => importProducts(false)}
          disabled={!importFile || pending}
        >
          Импортировать
        </Button>
      </div>
      <ResourceState
        loading={loading}
        error={loadError}
        empty={!items.length}
        onRetry={() => void load()}
        emptyText="Товары по выбранным условиям не найдены."
      />
      {!loading && !loadError && (
        <p className="muted" style={{ fontSize: 12, marginBottom: 14 }}>
          Найдено товаров: {total}
        </p>
      )}
      <DataTable
        headers={["Товар", "Категория", "Бренд", "Поставщики", "Предложения", "Статус", "Действия"]}
      >
        {items.map((product) => (
          <tr key={product.id}>
            <td>
              <strong>{product.nameRu}</strong>
              <br />
              <span className="mono muted">{product.sku}</span>
            </td>
            <td>{product.categoryName}</td>
            <td>{product.brand}</td>
            <td>
              <Link href={`/admin/offers?q=${encodeURIComponent(product.sku)}`}>
                {product.supplierNames?.join(", ") || "Не назначен"}
              </Link>
            </td>
            <td>{product.offerCount}</td>
            <td>
              <Badge
                tone={
                  product.status === "PUBLISHED"
                    ? "success"
                    : product.status === "REJECTED"
                      ? "danger"
                      : "neutral"
                }
              >
                {PRODUCT_STATUS_LABELS[product.status] ?? product.status}
              </Badge>
            </td>
            <td>
              <Button variant="ghost" onClick={() => edit(product)}>
                Изменить
              </Button>
            </td>
          </tr>
        ))}
      </DataTable>
      <Pagination page={page} pages={Math.ceil(total / 24)} onPage={setPage} />
      <Modal
        open={open}
        title={editing ? "Редактировать товар" : "Новый товар"}
        onClose={() => setOpen(false)}
      >
        <div className="stack-form">
          <div className="form-grid">
            <Field label="SKU">
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </Field>
            <Field label="Slug">
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Название">
            <Input
              value={form.nameRu}
              onChange={(e) => setForm({ ...form, nameRu: e.target.value })}
            />
          </Field>
          <div className="form-grid">
            <CategoryPicker
              categories={categories}
              value={form.categoryId}
              onChange={(categoryId) => setForm({ ...form, categoryId, attributes: "" })}
            />
            <Field label="Статус">
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {["DRAFT", "PENDING", "PUBLISHED", "REJECTED", "ARCHIVED"].map((status) => (
                  <option key={status} value={status}>
                    {PRODUCT_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {form.status === "REJECTED" && (
            <Field label="Причина отклонения" hint="Причина сохраняется в истории товара.">
              <Textarea
                value={form.rejectReason}
                minLength={5}
                maxLength={2000}
                onChange={(e) => setForm({ ...form, rejectReason: e.target.value })}
              />
            </Field>
          )}
          <div className="form-grid">
            <Field label="Бренд">
              <Input
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </Field>
            <Field label="Единица">
              <Input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Наценка, %">
            <Input
              inputMode="decimal"
              value={form.markupPercent}
              onChange={(e) =>
                setForm({ ...form, markupPercent: e.target.value.replace(",", ".") })
              }
            />
          </Field>
          <Field label="Описание">
            <Textarea
              value={form.descriptionRu}
              onChange={(e) => setForm({ ...form, descriptionRu: e.target.value })}
            />
          </Field>
          {attributesLoading && <p role="status">Загрузка характеристик…</p>}
          {attributeFields.map((field) => (
            <Field
              key={field.key}
              label={`${field.label}${field.unit ? `, ${field.unit}` : ""}`}
              hint={
                field.recommended ? "Рекомендуется заполнить для поиска и сравнения" : undefined
              }
            >
              {field.options?.length || field.type === "boolean" ? (
                <Select
                  disabled={attributesLoading}
                  value={attributeMap[field.key] ?? attributeMap[field.label] ?? ""}
                  onChange={(event) => setAttribute(field.key, event.target.value)}
                >
                  <option value="">Не указано</option>
                  {[
                    ...new Set([
                      ...(field.options ?? (field.type === "boolean" ? ["Да", "Нет"] : [])),
                      ...(attributeMap[field.key] ? [attributeMap[field.key]] : []),
                    ]),
                  ].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  disabled={attributesLoading}
                  type={
                    field.type === "range" &&
                    (!attributeMap[field.key] ||
                      /^-?\d+(?:[.,]\d+)?$/.test(attributeMap[field.key]))
                      ? "number"
                      : "text"
                  }
                  step={field.type === "range" ? "any" : undefined}
                  value={attributeMap[field.key] ?? attributeMap[field.label] ?? ""}
                  onChange={(event) => setAttribute(field.key, event.target.value)}
                />
              )}
            </Field>
          ))}
          <Field
            label="Дополнительные характеристики"
            hint="Каждая строка: Название: значение. Сохранённые нестандартные поля остаются доступны."
          >
            <Textarea
              disabled={attributesLoading}
              value={unknownAttributes}
              onChange={(event) => {
                const known = Object.entries(attributeMap)
                  .filter(([name]) =>
                    getSmartFiltersForCategory(
                      categories.find((category) => category.id === form.categoryId)?.slug,
                    ).some((field) => field.key === name || field.label === name),
                  )
                  .map(([name, value]) => `${name}: ${value}`);
                setForm({
                  ...form,
                  attributes: [...known, event.target.value].filter(Boolean).join("\n"),
                });
              }}
            />
          </Field>
          {editing && (
            <Field label="Добавить изображение" hint="JPEG, PNG или WebP, до 5 МБ">
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              />
            </Field>
          )}
          {error && (
            <div className="form-alert" role="alert">
              {error}
            </div>
          )}
          <Button loading={pending} disabled={attributesLoading} onClick={save}>
            Сохранить товар
          </Button>
        </div>
      </Modal>
      {message && <Toast text={message} onClose={() => setMessage("")} />}
    </>
  );
}

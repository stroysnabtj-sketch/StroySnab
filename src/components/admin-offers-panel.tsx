"use client";
import { useEffect, useState } from "react";
import {
  Button,
  DataTable,
  Field,
  Input,
  Modal,
  Select,
  Pagination,
  ResourceState,
  adminRequest,
  useAdminResource,
} from "@/components/admin-ui";
import { fromDirams, toDirams } from "@/modules/system/money";
type Supplier = { id: string; name: string };
type Product = { id: string; sku: string; name: string };
type Offer = {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  unit: string;
  supplierId: string;
  supplierName: string;
  supplierPriceDirams: string;
  stockQty: string;
  reservedQty: string;
  minOrderQty: string;
  leadTimeDays: number;
  isActive: string;
};
function OfferRow({ offer, onSaved }: { offer: Offer; onSaved: () => Promise<void> }) {
  const [price, setPrice] = useState(fromDirams(offer.supplierPriceDirams)),
    [stock, setStock] = useState(offer.stockQty),
    [lead, setLead] = useState(String(offer.leadTimeDays)),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    setPrice(fromDirams(offer.supplierPriceDirams));
    setStock(offer.stockQty);
    setLead(String(offer.leadTimeDays));
  }, [offer.supplierPriceDirams, offer.stockQty, offer.leadTimeDays]);
  const dirty =
    price !== fromDirams(offer.supplierPriceDirams) ||
    stock !== offer.stockQty ||
    lead !== String(offer.leadTimeDays);
  async function save() {
    if (busy) return;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await adminRequest(`/api/admin/offers/${offer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: offer.supplierId,
          supplierPriceDirams: toDirams(price).toString(),
          stockQty: stock,
          leadTimeDays: Number(lead),
        }),
      });
      await onSaved();
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setBusy(false);
    }
  }
  return (
    <tr>
      <td data-label="Товар">
        <div>
          <strong>{offer.productName}</strong>
          <br />
          <span className="mono muted">{offer.sku}</span>
        </div>
      </td>
      <td data-label="Поставщик">
        <div>{offer.supplierName}</div>
      </td>
      <td data-label="Цена, TJS">
        <div>
          <Input
            inputMode="decimal"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              setSaved(false);
            }}
            aria-label={`Закупочная цена ${offer.sku}`}
          />
        </div>
      </td>
      <td data-label="Остаток">
        <div>
          <Input
            inputMode="decimal"
            value={stock}
            onChange={(e) => {
              setStock(e.target.value);
              setSaved(false);
            }}
            aria-label={`Остаток ${offer.sku}`}
          />
          <small style={{ display: "block", marginTop: 5 }}>
            Резерв: {offer.reservedQty} {offer.unit}
          </small>
        </div>
      </td>
      <td data-label="Срок, дней">
        <div>
          <Input
            type="number"
            min={0}
            max={365}
            value={lead}
            onChange={(e) => {
              setLead(e.target.value);
              setSaved(false);
            }}
            aria-label={`Срок ${offer.sku}`}
          />
        </div>
      </td>
      <td data-label="Действие">
        <div>
          <Button variant="secondary" loading={busy} disabled={!dirty} onClick={() => void save()}>
            {saved ? "Сохранено" : "Сохранить"}
          </Button>
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
        </div>
      </td>
    </tr>
  );
}
const blank = {
  productId: "",
  supplierId: "",
  price: "",
  stockQty: "0",
  minOrderQty: "1",
  leadTimeDays: "0",
};
export function AdminOffersPanel() {
  const [supplierId, setSupplierId] = useState(""),
    [q, setQ] = useState(""),
    [page, setPage] = useState(1),
    [open, setOpen] = useState(false),
    [form, setForm] = useState(blank),
    [productQ, setProductQ] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const resource = useAdminResource<{ items: Offer[]; total: number; pageSize: number }>(
      `/api/admin/offers?${new URLSearchParams({ supplierId, q, page: String(page) })}`,
    ),
    shops = useAdminResource<{ items: Supplier[] }>("/api/admin/suppliers"),
    options = useAdminResource<{ products: Product[] }>("/api/admin/offers/options");
  const items = resource.data?.items ?? [],
    suppliers = shops.data?.items ?? [],
    products = options.data?.products ?? [],
    filtered = products.filter(
      (product) =>
        !productQ ||
        `${product.name} ${product.sku}`
          .toLocaleLowerCase("ru")
          .includes(productQ.toLocaleLowerCase("ru")),
    );
  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await adminRequest("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          supplierPriceDirams: toDirams(form.price).toString(),
          leadTimeDays: Number(form.leadTimeDays),
          isActive: "true",
        }),
      });
      setOpen(false);
      setMessage("Предложение сохранено");
      await resource.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить предложение");
    } finally {
      setBusy(false);
    }
  }
  async function importCsv() {
    if (!file || !supplierId || busy) return;
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("supplierId", supplierId);
      const result = await adminRequest<{ updated: number; total: number; errors: unknown[] }>(
        "/api/admin/offers/import",
        { method: "POST", body },
      );
      setMessage(`Обновлено ${result.updated} из ${result.total}; ошибок ${result.errors.length}`);
      await resource.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось импортировать файл");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="panel-toolbar">
        <div className="filters">
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            aria-label="Поиск предложений"
            placeholder="Название товара или артикул"
          />
          <Select
            value={supplierId}
            onChange={(e) => {
              setSupplierId(e.target.value);
              setPage(1);
            }}
            aria-label="Поставщик для фильтра и импорта"
          >
            <option value="">Все поставщики</option>
            {suppliers.map((supplier) => (
              <option value={supplier.id} key={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </Select>
        </div>
        <Button
          disabled={options.loading || shops.loading || !!options.error || !!shops.error}
          onClick={() => {
            setForm({
              ...blank,
              supplierId: supplierId || suppliers[0]?.id || "",
              productId: products[0]?.id || "",
            });
            setProductQ("");
            setError("");
            setOpen(true);
          }}
        >
          Добавить предложение
        </Button>
      </div>
      {(shops.error || options.error) && (
        <p className="form-alert" role="alert">
          Не удалось загрузить справочники.{" "}
          <button
            type="button"
            onClick={() => {
              void shops.reload();
              void options.reload();
            }}
          >
            Повторить
          </button>
        </p>
      )}
      <details className="import-bar">
        <summary>Загрузить цены и остатки из файла</summary>
        <p className="muted">
          Выберите поставщика в фильтре. Поддерживаются CSV и XLSX: sku, supplierPriceTjs, stockQty,
          minOrderQty, leadTimeDays, isActive.
        </p>
        <Input
          type="file"
          accept=".csv,.xlsx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          aria-label="CSV остатков"
        />
        <Button
          variant="secondary"
          disabled={!file || !supplierId || busy}
          loading={busy}
          onClick={() => void importCsv()}
        >
          Обновить из файла
        </Button>
      </details>
      {message && (
        <p role="status" className="form-success">
          {message}
        </p>
      )}
      {error && !open && (
        <p role="alert" className="form-alert">
          {error}
        </p>
      )}
      <ResourceState
        loading={resource.loading}
        error={resource.error}
        empty={!items.length}
        onRetry={() => void resource.reload()}
      />
      <DataTable
        headers={[
          "Товар",
          "Поставщик",
          "Закупочная цена, TJS",
          "Остаток",
          "Срок, дней",
          "Действие",
        ]}
      >
        {items.map((offer) => (
          <OfferRow key={offer.id} offer={offer} onSaved={resource.reload} />
        ))}
      </DataTable>
      <Pagination
        page={page}
        pages={Math.ceil((resource.data?.total ?? 0) / 24)}
        onPage={setPage}
      />
      <Modal open={open} title="Новое предложение" onClose={() => !busy && setOpen(false)}>
        <form className="stack-form" onSubmit={create}>
          <Field label="Поставщик">
            <Select
              required
              value={form.supplierId}
              onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
            >
              {suppliers.map((supplier) => (
                <option value={supplier.id} key={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Поиск товара">
            <Input
              value={productQ}
              onChange={(e) => setProductQ(e.target.value)}
              placeholder="Название или артикул"
            />
          </Field>
          <Field label="Товар">
            <Select
              required
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
            >
              {!filtered.some((p) => p.id === form.productId) &&
                products.find((p) => p.id === form.productId) && (
                  <option value={form.productId}>
                    {products.find((p) => p.id === form.productId)?.name}
                  </option>
                )}
              {filtered.map((product) => (
                <option value={product.id} key={product.id}>
                  {product.sku} · {product.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="form-grid">
            <Field label="Закупочная цена, TJS">
              <Input
                required
                inputMode="decimal"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </Field>
            <Field label="Остаток">
              <Input
                required
                inputMode="decimal"
                value={form.stockQty}
                onChange={(e) => setForm({ ...form, stockQty: e.target.value })}
              />
            </Field>
            <Field label="Минимальная партия">
              <Input
                required
                inputMode="decimal"
                value={form.minOrderQty}
                onChange={(e) => setForm({ ...form, minOrderQty: e.target.value })}
              />
            </Field>
            <Field label="Срок поставки, дней">
              <Input
                type="number"
                required
                min={0}
                max={365}
                value={form.leadTimeDays}
                onChange={(e) => setForm({ ...form, leadTimeDays: e.target.value })}
              />
            </Field>
          </div>
          {error && (
            <p role="alert" className="form-alert">
              {error}
            </p>
          )}
          <Button type="submit" loading={busy}>
            Сохранить предложение
          </Button>
        </form>
      </Modal>
    </>
  );
}

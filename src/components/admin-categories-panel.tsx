"use client";
import { useCallback, useEffect, useState } from "react";
import { ChevronRight, Folder, FolderOpen, Layers3, Plus, Search } from "lucide-react";
import { Button, Field, Input, Modal, Select, Toast } from "@/components/admin-ui";
import { categoryPath } from "@/components/category-picker";
import {
  CATEGORIES_TREE,
  REFERENCE_CATEGORY_SLUGS,
  getCategoryProfile,
  getSmartFiltersForCategory,
} from "@/modules/catalog/categories-data";
type Category = {
  id: string;
  parentId: string | null;
  slug: string;
  nameRu: string;
  sort: number;
  isActive: string;
};
export function AdminCategoriesPanel() {
  const [items, setItems] = useState<Category[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ slug: "", nameRu: "", parentId: "", sort: 0 });
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/catalog/categories");
      if (!response.ok) throw new Error("Не удалось загрузить категории");
      setItems((await response.json()).items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сети");
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const current = items.find((item) => item.id === selected);
  const fields = getSmartFiltersForCategory(current?.slug).filter(
    (field) => !["brand", "price", "inStock"].includes(field.key),
  );
  const profile = getCategoryProfile(current?.slug);
  const children = (id: string | null) =>
    items
      .filter((item) => item.parentId === id)
      .sort((a, b) => a.sort - b.sort || a.nameRu.localeCompare(b.nameRu, "ru"));
  const hasReferenceTree = CATEGORIES_TREE.every((root) =>
    items.some((item) => item.slug === root.slug),
  );
  const referenceRoots = children(null).filter(
    (item) => !hasReferenceTree || REFERENCE_CATEGORY_SLUGS.has(item.slug),
  );
  const legacyRoots = children(null).filter(
    (item) => hasReferenceTree && !REFERENCE_CATEGORY_SLUGS.has(item.slug),
  );
  const leaves = items.filter((item) => !items.some((child) => child.parentId === item.id));
  async function save() {
    setPending(true);
    setError("");
    try {
      const response = await fetch(
        editing ? `/api/admin/catalog/categories/${editing.id}` : "/api/admin/catalog/categories",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            parentId: form.parentId || null,
            ...(editing ? {} : { isActive: "true" }),
          }),
        },
      );
      if (!response.ok)
        throw new Error("Не удалось создать категорию. Проверьте название и уникальность адреса.");
      setOpen(false);
      setMessage(editing ? "Категория обновлена" : "Категория создана");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сети");
    } finally {
      setPending(false);
    }
  }
  async function toggle(item: Category) {
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/catalog/categories/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: item.isActive === "true" ? "false" : "true" }),
      });
      if (!response.ok) throw new Error("Не удалось изменить видимость");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сети");
    } finally {
      setPending(false);
    }
  }
  function renderNode(item: Category, trail: string[] = []): React.ReactNode {
    if (trail.includes(item.id)) return null;
    const nested = children(item.id);
    const isOpen = expanded.has(item.id);
    return (
      <div key={item.id} className="taxonomy-node">
        <div className={`taxonomy-row ${selected === item.id ? "is-selected" : ""}`}>
          {nested.length ? (
            <button
              className="taxonomy-expand"
              aria-label={`${isOpen ? "Свернуть" : "Раскрыть"} ${item.nameRu}`}
              aria-expanded={isOpen}
              onClick={() =>
                setExpanded((old) => {
                  const next = new Set(old);
                  if (next.has(item.id)) next.delete(item.id);
                  else next.add(item.id);
                  return next;
                })
              }
            >
              <ChevronRight size={15} style={{ transform: isOpen ? "rotate(90deg)" : undefined }} />
            </button>
          ) : (
            <span className="taxonomy-spacer" />
          )}
          <button
            className="taxonomy-select"
            onClick={() => setSelected(item.id)}
            aria-pressed={selected === item.id}
          >
            {nested.length ? (
              isOpen ? (
                <FolderOpen size={17} />
              ) : (
                <Folder size={17} />
              )
            ) : (
              <Layers3 size={15} />
            )}
            <span>{item.nameRu}</span>
            {nested.length > 0 && <small>{nested.length}</small>}
            {item.isActive === "false" && <small>Скрыта</small>}
          </button>
        </div>
        {nested.length > 0 && isOpen && (
          <div className="taxonomy-children">
            {nested.map((child) => renderNode(child, [...trail, item.id]))}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="taxonomy">
      <div className="taxonomy-heading">
        <div>
          <span className="small-label">Структура ассортимента</span>
          <h2>Каталог и характеристики</h2>
          <p className="muted">
            {referenceRoots.length} разделов ·{" "}
            {hasReferenceTree
              ? leaves.filter((item) => REFERENCE_CATEGORY_SLUGS.has(item.slug)).length
              : leaves.length}{" "}
            товарных групп
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setForm({ slug: "", nameRu: "", parentId: current?.id ?? "", sort: 0 });
            setOpen(true);
          }}
        >
          <Plus size={17} />
          Добавить категорию
        </Button>
      </div>
      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}
      <div className="taxonomy-layout">
        <section className="taxonomy-browser" aria-label="Дерево категорий">
          <label className="taxonomy-search">
            <Search size={18} />
            <input
              aria-label="Найти категорию в дереве"
              placeholder="Найти категорию…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="taxonomy-tree">
            {query ? (
              items
                .filter((item) =>
                  categoryPath(item, items).toLowerCase().includes(query.toLowerCase()),
                )
                .map((item) => (
                  <button
                    key={item.id}
                    className="taxonomy-search-result"
                    onClick={() => setSelected(item.id)}
                  >
                    {categoryPath(item, items)}
                  </button>
                ))
            ) : (
              <>
                {referenceRoots.map((item) => renderNode(item))}
                {legacyRoots.length > 0 && (
                  <details className="taxonomy-legacy">
                    <summary>Прежние категории · {legacyRoots.length}</summary>
                    {legacyRoots.map((item) => renderNode(item))}
                  </details>
                )}
              </>
            )}
            {query &&
              !items.some((item) =>
                categoryPath(item, items).toLowerCase().includes(query.toLowerCase()),
              ) && <p className="muted">Категории не найдены</p>}
          </div>
        </section>
        <section className="taxonomy-detail" aria-label="Свойства категории">
          {current ? (
            <>
              <span className="small-label">
                {children(current.id).length ? "Раздел каталога" : "Товарная группа"}
              </span>
              <h2>{current.nameRu}</h2>
              <p className="taxonomy-breadcrumb">{categoryPath(current, items)}</p>
              <div className="taxonomy-meta">
                <code>/{current.slug}</code>
                <span>{current.isActive === "true" ? "Активна" : "Скрыта"}</span>
              </div>
              <div className="table-actions">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditing(current);
                    setForm({
                      slug: current.slug,
                      nameRu: current.nameRu,
                      parentId: current.parentId ?? "",
                      sort: current.sort,
                    });
                    setError("");
                    setOpen(true);
                  }}
                >
                  Изменить категорию
                </Button>
                <Button variant="secondary" disabled={pending} onClick={() => toggle(current)}>
                  {current.isActive === "true" ? "Скрыть категорию" : "Показать категорию"}
                </Button>
              </div>
              {children(current.id).length ? (
                <>
                  <h3>Внутри раздела</h3>
                  <div className="taxonomy-subcategories">
                    {children(current.id).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelected(item.id);
                          setExpanded((old) => new Set([...old, current.id]));
                        }}
                      >
                        {item.nameRu}
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </div>
                  <p className="muted">
                    Характеристики назначаются товарным группам. Выберите группу, чтобы увидеть её
                    поля.
                  </p>
                </>
              ) : (
                <>
                  <h3>
                    Характеристики товара <span className="muted">{fields.length}</span>
                  </h3>
                  {profile?.mixed && (
                    <p className="taxonomy-note">
                      Смешанная группа: сначала укажите вид изделия. Связанные поля появятся после
                      выбора.
                    </p>
                  )}
                  <div className="taxonomy-fields">
                    {fields.map((field) => (
                      <div key={field.key}>
                        <span>
                          <strong>{field.label}</strong>
                          {field.recommended && <small>Основное поле</small>}
                        </span>
                        <span>
                          {field.type === "range"
                            ? "Число"
                            : field.type === "boolean"
                              ? "Да / нет"
                              : "Значение"}
                          {field.unit ? ` · ${field.unit}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                  {!fields.length && (
                    <p className="muted">Для этой категории профиль пока не задан.</p>
                  )}
                  <p className="muted">
                    Цена, производитель и наличие задаются отдельно. Значения фильтров витрины
                    формируются по заполненным товарам.
                  </p>
                </>
              )}
            </>
          ) : (
            <div className="taxonomy-empty">
              <FolderOpen size={42} />
              <h2>Выберите категорию</h2>
              <p>Раскройте раздел слева или найдите нужную товарную группу.</p>
            </div>
          )}
        </section>
      </div>
      <Modal
        open={open}
        title={editing ? "Редактировать категорию" : "Новая категория"}
        onClose={() => setOpen(false)}
      >
        <div className="stack-form">
          <Field label="Название">
            <Input
              value={form.nameRu}
              onChange={(e) => setForm({ ...form, nameRu: e.target.value })}
            />
          </Field>
          <Field label="Адрес категории">
            <Input
              disabled={!!editing && REFERENCE_CATEGORY_SLUGS.has(editing.slug)}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </Field>
          <Field label="Родительский раздел">
            <Select
              value={form.parentId}
              onChange={(e) => setForm({ ...form, parentId: e.target.value })}
            >
              <option value="">Корневая категория</option>
              {items
                .filter(
                  (item) =>
                    !editing || !categoryPath(item, items).startsWith(categoryPath(editing, items)),
                )
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {categoryPath(item, items)}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Порядок">
            <Input
              type="number"
              value={form.sort}
              onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })}
            />
          </Field>
          {error && (
            <p role="alert" className="form-alert">
              {error}
            </p>
          )}
          <Button
            loading={pending}
            disabled={!form.nameRu.trim() || !form.slug.trim()}
            onClick={save}
          >
            {editing ? "Сохранить изменения" : "Создать категорию"}
          </Button>
        </div>
      </Modal>
      {message && <Toast text={message} onClose={() => setMessage("")} />}
    </div>
  );
}

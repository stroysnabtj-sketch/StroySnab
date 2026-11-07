"use client";
import { CustomSelect } from "@/components/custom-select";
import { CATEGORIES_TREE, REFERENCE_CATEGORY_SLUGS } from "@/modules/catalog/categories-data";
import { useId, useState } from "react";

export type PickerCategory = {
  id: string;
  slug?: string;
  nameRu: string;
  parentId: string | null;
  isActive?: string;
};
export function categoryPath(category: PickerCategory, categories: PickerCategory[]) {
  const names = [category.nameRu];
  const seen = new Set([category.id]);
  let parent = category.parentId;
  while (parent && !seen.has(parent)) {
    seen.add(parent);
    const row = categories.find((item) => item.id === parent);
    if (!row) break;
    names.unshift(row.nameRu);
    parent = row.parentId;
  }
  return names.join(" / ");
}

export function CategoryPicker({
  categories,
  value,
  onChange,
  disabled,
}: {
  categories: PickerCategory[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const controlId = useId();
  const hasReferenceTree = CATEGORIES_TREE.every((root) =>
    categories.some((item) => item.slug === root.slug),
  );
  const parents = new Set(categories.map((item) => item.parentId));
  const leaves = categories.filter(
    (item) =>
      !parents.has(item.id) &&
      (item.isActive !== "false" || item.id === value) &&
      (!hasReferenceTree || REFERENCE_CATEGORY_SLUGS.has(item.slug ?? "") || item.id === value),
  );
  const matches = leaves.filter(
    (item) =>
      item.id === value ||
      categoryPath(item, categories)
        .toLocaleLowerCase("ru")
        .includes(query.toLocaleLowerCase("ru")),
  );
  return (
    <div className="category-picker">
      <div className="field">
        <label className="field-label" htmlFor={`${controlId}-search`}>
          Найти категорию
        </label>
        <input
          id={`${controlId}-search`}
          className="input"
          type="search"
          value={query}
          disabled={disabled}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Например, кирпич или сантехника"
        />
      </div>
      <div className="field">
        <label className="field-label" htmlFor={controlId}>
          Категория
        </label>
        <CustomSelect
          id={controlId}
          className="input"
          value={value}
          required
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Выберите товарную группу</option>
          {value && !leaves.some((item) => item.id === value) && (
            <option value={value}>
              {categoryPath(
                categories.find((item) => item.id === value) ?? {
                  id: value,
                  nameRu: "Неизвестная категория",
                  parentId: null,
                },
                categories,
              )}{" "}
              — уточните группу
            </option>
          )}
          {matches.map((item) => (
            <option key={item.id} value={item.id}>
              {categoryPath(item, categories)}
            </option>
          ))}
        </CustomSelect>
      </div>
      <small className="muted">
        {matches.length
          ? `Товарных групп: ${matches.length}`
          : "Ничего не найдено. Измените запрос."}
      </small>
      {categories.some((item) => item.id === value) && (
        <small className="category-selection">
          {categoryPath(
            categories.find((item) => item.id === value)!,
            categories,
          )}
        </small>
      )}
    </div>
  );
}

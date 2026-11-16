"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { useLocale } from "@/i18n/provider";

export function ActiveFilterChips({ currentCategory, facetLabels = {} }: { currentCategory?: string; facetLabels?: Record<string,{label:string;unit?:string}> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tr } = useLocale();

  // Игнорируемые системные параметры
  const ignoredKeys = new Set(["page", "sort", "pageSize", "category", "attributeName"]);

  const activeChips: { key: string; value: string; label: string }[] = [];

  searchParams.forEach((value, key) => {
    if (ignoredKeys.has(key)) return;
    if (key === "q" && value) {
      activeChips.push({ key, value, label: `${tr("Поиск")}: ${value}` });
    } else if (key === "category" && value) {
      activeChips.push({ key, value, label: `${tr("Категория")}: ${value}` });
    } else if (key === "brand" && value) {
      activeChips.push({ key, value, label: `${tr("Бренд")}: ${value}` });
    } else if (key === "inStock" && value === "1") {
      activeChips.push({ key, value, label: tr("В наличии") });
    } else if (key === "minPrice" && value) {
      activeChips.push({ key, value, label: `${tr("От")} ${value} TJS` });
    } else if (key === "maxPrice" && value) {
      activeChips.push({ key, value, label: `${tr("До")} ${value} TJS` });
    } else if (value) {
      const range = key.match(/^range(Min|Max)\.(.+)$/);
      const field = facetLabels[range?.[2] ?? key];
      const fieldName = tr(field?.label ?? range?.[2] ?? key);
      const valName = tr(value);
      activeChips.push({
        key,
        value,
        label: range
          ? `${fieldName} ${range[1] === "Min" ? tr("От").toLowerCase() : tr("До").toLowerCase()} ${value}${field?.unit ? ` ${field.unit}` : ""}`
          : `${fieldName}: ${valName}`,
      });
    }
  });

  if (activeChips.length === 0) return null;

  const removeChip = (chipKey: string, chipValue: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (currentCategory) next.set("category", currentCategory);
    const currentValues = next.getAll(chipKey);
    next.delete(chipKey);
    next.delete("page");
    currentValues.filter((v) => v !== chipValue).forEach((v) => next.append(chipKey, v));
    router.push(`/catalog?${next.toString()}`, { scroll: false });
  };

  const clearAll = () => {
    const next = new URLSearchParams();
    const cat = currentCategory ?? searchParams.get("category");
    if (cat) next.set("category", cat);
    router.push(`/catalog${cat ? `?category=${encodeURIComponent(cat)}` : ""}`);
  };

  return (
    <div className="active-filters-bar" aria-label="Применённые фильтры">
      <span className="active-filters-label">{tr("Выбрано")}:</span>
      <div className="active-chips-list">
        {activeChips.map((chip, idx) => (
          <button
            key={`${chip.key}-${chip.value}-${idx}`}
            type="button"
            className="filter-chip-tag"
            onClick={() => removeChip(chip.key, chip.value)}
            title={`Удалить фильтр «${chip.label}»`}
          >
            <span>{chip.label}</span>
            <X size={13} aria-hidden="true" />
          </button>
        ))}
        {activeChips.length > 1 && (
          <button type="button" className="filter-clear-all-btn" onClick={clearAll}>
            {tr("Очистить все")}
          </button>
        )}
      </div>
    </div>
  );
}

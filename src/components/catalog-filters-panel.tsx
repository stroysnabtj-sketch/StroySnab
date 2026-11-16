"use client";
import { useLocale } from "@/i18n/provider";
import { CustomSelect } from "@/components/custom-select";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { ChevronDown, ChevronUp, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import type { FilterFacetOption, SmartFilterFacetGroup } from "@/modules/catalog/types";

import { AttributeRangeFilter } from "@/components/attribute-range-filter";
import { scrollToCatalogResults } from "@/components/active-filter-chips";

interface Props {
  currentCategory?: string;
  allBrands: string[];
  brandFacets?: FilterFacetOption[];
  facets: SmartFilterFacetGroup[];
  totalProducts: number;
}

export function CatalogFiltersPanel({
  currentCategory,
  allBrands,
  brandFacets = [],
  facets,
  totalProducts,
}: Props) {
  const { tr } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    panel?.querySelector<HTMLButtonElement>(".filter-close-btn")?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const controls = Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]',
        ) ?? [],
      ).filter((element) => element.getClientRects().length);
      const first = controls[0],
        last = controls.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const resize = () => {
      if (window.innerWidth > 760) setMobileOpen(false);
    };
    document.addEventListener("keydown", keydown);
    window.addEventListener("resize", resize);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keydown);
      window.removeEventListener("resize", resize);
      if (previous?.isConnected) previous.focus();
    };
  }, [mobileOpen]);
  const pushCatalogFilters = (next: URLSearchParams) => {
    const query = next.toString();
    startTransition(() => {
      router.push(query ? `/catalog?${query}` : "/catalog", { scroll: false });
    });
    scrollToCatalogResults();
  };

  const applyRange = (key: string, min: string, max: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("page");
    for (const [name, value] of [
      [`rangeMin.${key}`, min],
      [`rangeMax.${key}`, max],
    ]) {
      if (value) next.set(name, value);
      else next.delete(name);
    }
    pushCatalogFilters(next);
  };

  // Состояние свернутых/развернутых групп
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    price: true,
    brand: true,
    ...Object.fromEntries(facets.map((f) => [f.key, true])),
  });

  // Поисковые строки внутри фильтров с многими опциями
  const [groupSearches, setGroupSearches] = useState<Record<string, string>>({});

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }));
  };

  const handleSearchChange = (key: string, val: string) => {
    setGroupSearches((prev) => ({ ...prev, [key]: val }));
  };

  // Получить текущие активные значения параметра из URL
  const getParamValues = (paramName: string): string[] => {
    const vals = searchParams.getAll(paramName);
    if (vals.length > 0) return vals;
    const single = searchParams.get(paramName);
    return single ? [single] : [];
  };

  // Проверить, выбран ли атрибут
  const isSelected = (key: string, value: string): boolean => {
    const current = getParamValues(key);
    return current.includes(value);
  };

  // Переключить значение фильтра (мультивыбор)
  const toggleFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (currentCategory) next.set("category", currentCategory);
    const currentValues = next.getAll(key);

    next.delete(key);
    next.delete("page"); // сброс пагинации при смене фильтра

    if (currentValues.includes(value)) {
      // Удаляем
      currentValues.filter((v) => v !== value).forEach((v) => next.append(key, v));
    } else {
      // Добавляем
      [...currentValues, value].forEach((v) => next.append(key, v));
    }

    pushCatalogFilters(next);
  };

  // Обработка диапазона цен
  const [minPriceInput, setMinPriceInput] = useState(searchParams.get("minPrice") ?? "");
  const [maxPriceInput, setMaxPriceInput] = useState(searchParams.get("maxPrice") ?? "");

  useEffect(() => {
    setMinPriceInput(searchParams.get("minPrice") ?? "");
    setMaxPriceInput(searchParams.get("maxPrice") ?? "");
  }, [searchParams]);

  const selectFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (currentCategory) next.set("category", currentCategory);
    next.delete("page");
    next.delete(key);
    if (value) next.set(key, value);
    pushCatalogFilters(next);
  };

  const applyPrice = () => {
    const next = new URLSearchParams(searchParams.toString());
    if (currentCategory) next.set("category", currentCategory);
    next.delete("page");
    if (minPriceInput.trim()) next.set("minPrice", minPriceInput.trim());
    else next.delete("minPrice");
    if (maxPriceInput.trim()) next.set("maxPrice", maxPriceInput.trim());
    else next.delete("maxPrice");

    pushCatalogFilters(next);
  };

  // Переключение "Только в наличии"
  const toggleInStock = (checked: boolean) => {
    const next = new URLSearchParams(searchParams.toString());
    if (currentCategory) next.set("category", currentCategory);
    next.delete("page");
    if (checked) next.set("inStock", "1");
    else next.delete("inStock");

    pushCatalogFilters(next);
  };

  // Сброс всех фильтров
  const resetAll = () => {
    const next = new URLSearchParams();
    if (currentCategory) next.set("category", currentCategory);
    setMinPriceInput("");
    setMaxPriceInput("");
    pushCatalogFilters(next);
  };

  return (
    <>
      {/* Мобильная кнопка вызова фильтров */}
      <button
        type="button"
        className="mobile-filter-trigger"
        onClick={() => setMobileOpen(true)}
        aria-expanded={mobileOpen}
      >
        <SlidersHorizontal size={18} />
        <span>Фильтры ({totalProducts})</span>
      </button>

      {/* Оверлей для мобильного вида */}
      {mobileOpen && (
        <div
          className="mobile-filter-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Основной сайдбар фильтров */}
      <aside
        ref={panelRef}
        role={mobileOpen ? "dialog" : undefined}
        aria-modal={mobileOpen ? true : undefined}
        aria-labelledby={titleId}
        className={`filter-sidebar ${mobileOpen ? "is-mobile-open" : ""}`}
      >
        {/* Заголовок фильтров */}
        <div className="filter-header">
          <div className="filter-header-title">
            <SlidersHorizontal size={18} />
            <h3 id={titleId}>{tr("Фильтры")}</h3>
          </div>
          <button
            type="button"
            className="filter-reset-btn"
            onClick={resetAll}
            title={tr("Сбросить все фильтры")}
          >
            <RotateCcw size={14} />
            <span>{tr("Сбросить")}</span>
          </button>
          {mobileOpen && (
            <button
              type="button"
              className="filter-close-btn"
              onClick={() => setMobileOpen(false)}
              aria-label={tr("Закрыть фильтры")}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Быстрый фильтр: Только в наличии */}
        <div className="filter-group filter-quick-toggle">
          <label className="filter-toggle-label">
            <input
              type="checkbox"
              checked={searchParams.get("inStock") === "1"}
              onChange={(e) => toggleInStock(e.target.checked)}
            />
            <span className="toggle-indicator" />
            <span className="toggle-text">{tr("Только в наличии")}</span>
          </label>
        </div>

        {/* Блок фильтра по цене */}
        <div className="filter-group">
          <button
            type="button"
            className="filter-group-header"
            onClick={() => toggleGroup("price")}
            aria-expanded={openGroups["price"]}
          >
            <span>{tr("Цена, сомони (TJS)")}</span>
            {openGroups["price"] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {openGroups["price"] && (
            <div className="filter-group-content">
              <div className="price-inputs-row">
                <input
                  type="number"
                  aria-label={tr("Минимальная цена в сомони")}
                  min="0"
                  step="0.01"
                  placeholder={tr("От")}
                  className="filter-input-price"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyPrice()}
                />
                <span className="price-sep">—</span>
                <input
                  type="number"
                  aria-label={tr("Максимальная цена в сомони")}
                  min="0"
                  step="0.01"
                  placeholder={tr("До")}
                  className="filter-input-price"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyPrice()}
                />
                <button
                  type="button"
                  className="button button-secondary price-apply-btn"
                  onClick={applyPrice}
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Фильтр по брендам */}
        {allBrands.length > 0 && (
          <div className="filter-group">
            <button
              type="button"
              className="filter-group-header"
              onClick={() => toggleGroup("brand")}
              aria-expanded={openGroups["brand"]}
            >
              <span>{tr("Бренд")}</span>
              {openGroups["brand"] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {openGroups["brand"] && (
              <div className="filter-group-content">
                {allBrands.length > 6 && (
                  <div className="filter-search-box">
                    <Search size={14} />
                    <input
                      type="text"
                      placeholder={tr("Поиск бренда...")}
                      value={groupSearches["brand"] ?? ""}
                      onChange={(e) => handleSearchChange("brand", e.target.value)}
                    />
                  </div>
                )}
                <div className="filter-options-list">
                  {allBrands
                    .filter((b) =>
                      !groupSearches["brand"]
                        ? true
                        : b.toLowerCase().includes(groupSearches["brand"]!.toLowerCase()),
                    )
                    .map((brand) => {
                      const checked = isSelected("brand", brand);
                      return (
                        <label key={brand} className="filter-checkbox-option">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleFilter("brand", brand)}
                          />
                          <span className="checkbox-custom" />
                          <span className="filter-option-label">{brand}</span>
                          <span className="filter-count-badge">
                            {brandFacets.find((option) => option.value === brand)?.count ?? 0}
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Умные динамические фильтры текущей категории */}
        {facets
          .filter(
            (facet) =>
              !allBrands.length ||
              (!["brand", "бренд"].includes(facet.key.toLowerCase()) &&
                facet.label.trim().toLowerCase() !== "бренд"),
          )
          .map((facet) => {
            const searchVal = groupSearches[facet.key]?.toLowerCase() ?? "";
            const filteredOptions = facet.options.filter((opt) =>
              searchVal ? opt.value.toLowerCase().includes(searchVal) : true,
            );

            if (facet.options.length === 0) return null;

            return (
              <div key={facet.key} className="filter-group">
                <button
                  type="button"
                  className="filter-group-header"
                  onClick={() => toggleGroup(facet.key)}
                  aria-expanded={openGroups[facet.key] ?? true}
                >
                  <span>{tr(facet.label)}</span>
                  {(openGroups[facet.key] ?? true) ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>

                {(openGroups[facet.key] ?? true) && (
                  <div className="filter-group-content">
                    {facet.options.length > 6 && (
                      <div className="filter-search-box">
                        <Search size={14} />
                        <input
                          type="text"
                          placeholder={`Поиск по ${facet.label.toLowerCase()}...`}
                          value={groupSearches[facet.key] ?? ""}
                          onChange={(e) => handleSearchChange(facet.key, e.target.value)}
                        />
                      </div>
                    )}

                    {facet.type === "range" ? (
                      <AttributeRangeFilter
                        facet={facet}
                        onApply={(min, max) => applyRange(facet.key, min, max)}
                      />
                    ) : facet.type === "select" || facet.type === "boolean" ? (
                      <CustomSelect
                        className="input"
                        aria-label={facet.label}
                        value={searchParams.get(facet.key) ?? ""}
                        onChange={(event) => selectFilter(facet.key, event.target.value)}
                      >
                        <option value="">{tr("Все")}</option>
                        {facet.options.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                            disabled={option.count === 0 && !isSelected(facet.key, option.value)}
                          >
                            {tr(option.value)} ({option.count})
                          </option>
                        ))}
                      </CustomSelect>
                    ) : (
                      <div className="filter-options-list">
                        {filteredOptions.map((opt) => {
                          const checked = isSelected(facet.key, opt.value);
                          return (
                            <label key={opt.value} className="filter-checkbox-option">
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={opt.count === 0 && !checked}
                                onChange={() => toggleFilter(facet.key, opt.value)}
                              />
                              <span className="checkbox-custom" />
                              <span className="filter-option-label">{tr(opt.value)}</span>
                              {<span className="filter-count-badge">{opt.count}</span>}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

        {/* Мобильная кнопка применить */}
        {mobileOpen && (
          <div className="mobile-filter-footer">
            <button
              type="button"
              className="button button-primary w-full"
              onClick={() => setMobileOpen(false)}
            >
              Показать ({totalProducts})
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

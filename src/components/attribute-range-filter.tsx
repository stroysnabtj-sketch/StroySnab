"use client";
import { useLocale } from "@/i18n/provider";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { SmartFilterFacetGroup } from "@/modules/catalog/types";
export function AttributeRangeFilter({
  facet,
  onApply,
}: {
  facet: SmartFilterFacetGroup;
  onApply: (min: string, max: string) => void;
}) {
  const { tr } = useLocale();
  const params = useSearchParams();
  const currentMin = params.get(`rangeMin.${facet.key}`) ?? "";
  const currentMax = params.get(`rangeMax.${facet.key}`) ?? "";
  const [min, setMin] = useState(currentMin);
  const [max, setMax] = useState(currentMax);
  const [error, setError] = useState("");
  useEffect(() => {
    setMin(currentMin);
    setMax(currentMax);
    setError("");
  }, [currentMin, currentMax]);
  function apply() {
    const lower = min.trim() ? Number(min.replace(",", ".")) : undefined;
    const upper = max.trim() ? Number(max.replace(",", ".")) : undefined;
    if (
      (lower !== undefined && !Number.isFinite(lower)) ||
      (upper !== undefined && !Number.isFinite(upper)) ||
      (lower !== undefined && upper !== undefined && lower > upper)
    ) {
      setError(tr("Проверьте границы диапазона"));
      return;
    }
    setError("");
    onApply(lower === undefined ? "" : String(lower), upper === undefined ? "" : String(upper));
  }
  return (
    <div>
      <div className="price-inputs-row">
        <input
          type="number"
          step="any"
          className="filter-input-price"
          aria-label={`${facet.label}: от`}
          placeholder={String(facet.min ?? tr("От"))}
          value={min}
          onChange={(e) => setMin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
        />
        <span>—</span>
        <input
          type="number"
          step="any"
          className="filter-input-price"
          aria-label={`${facet.label}: до`}
          placeholder={String(facet.max ?? tr("До"))}
          value={max}
          onChange={(e) => setMax(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
        />
        <button
          className="button button-secondary"
          type="button"
          onClick={apply}
          aria-label={`Применить диапазон: ${facet.label}`}
        >
          OK
        </button>
      </div>
      {facet.unit && <small className="muted">{facet.unit}</small>}
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

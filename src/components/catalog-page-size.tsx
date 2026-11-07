"use client";
import { CustomSelect } from "@/components/custom-select";

import { useRouter, useSearchParams } from "next/navigation";
import { CATALOG_PAGE_SIZES, catalogPageSizeUrl } from "@/modules/catalog/types";

export function CatalogPageSize({ currentSize }: { currentSize: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  return (
    <label className="sort-control">
      <span className="sort-label">Показывать:</span>
      <CustomSelect
        className="input"
        aria-label="Товаров на странице"
        value={currentSize}
        onChange={(event) =>
          router.push(
            catalogPageSizeUrl(
              new URLSearchParams(searchParams.toString()),
              Number(event.target.value),
            ),
            { scroll: false },
          )
        }
      >
        {CATALOG_PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </CustomSelect>
    </label>
  );
}

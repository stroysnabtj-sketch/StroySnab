"use client";
import { CustomSelect } from "@/components/custom-select";

import { useRouter, useSearchParams } from "next/navigation";

export function CatalogSortSelect({ currentSort = "name", currentCategory }: { currentSort?: string; currentCategory?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = new URLSearchParams(searchParams.toString());
    if (currentCategory) next.set("category",currentCategory);
    next.set("sort", e.target.value);
    next.delete("page");
    router.push(`/catalog?${next.toString()}`, { scroll: false });
  };

  return (
    <label className="sort-control">
      <span className="sort-label">Сортировка:</span>
      <CustomSelect
        className="input sort-select"
        value={currentSort}
        onChange={handleChange}
        aria-label="Сортировка товаров"
      >
        
        <option value="price_asc">Сначала дешевле</option>
        <option value="price_desc">Сначала дороже</option>
        <option value="name">По названию (А-Я)</option>
      </CustomSelect>
    </label>
  );
}


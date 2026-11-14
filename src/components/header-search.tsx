"use client";
import { useLocale } from "@/i18n/provider";
import Link from "next/link";
import { Search, ArrowUpRight } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
type Suggestion = { name: string; slug: string };
export function HeaderSearch() {
  const { tr } = useLocale();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const id = useId();
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (q.trim().length < 2) {
      setItems([]);
      setOpen(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/public/catalog/suggestions?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      })
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then((data: { items: Suggestion[] }) => {
          setItems(data.items);
          setActive(-1);
          setOpen(true);
        })
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);
  useEffect(() => {
    function outside(event: MouseEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);
  return (
    <div className="header-search-wrap" ref={container}>
      <form
        action="/catalog"
        className="header-search"
        role="search"
        onSubmit={(event) => {
          if (active >= 0 && items[active]) {
            event.preventDefault();
            setOpen(false);
            router.push(`/product/${items[active].slug}`);
          }
        }}
      >
        <input
          name="q"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          onFocus={() => items.length > 0 && setOpen(true)}
          onBlur={(event) => {
            if (!container.current?.contains(event.relatedTarget)) setOpen(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
            if (event.key === "ArrowDown" && items.length) {
              event.preventDefault();
              setOpen(true);
              setActive((v) => Math.min(v + 1, items.length - 1));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((v) => Math.max(-1, v - 1));
            }
          }}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-label={tr("Поиск товаров")}
          aria-expanded={open && items.length > 0}
          aria-controls={id}
          aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined}
          placeholder={tr("Название товара, марка или артикул")}
        />
        <button type="submit" aria-label={tr("Найти")}>
          <Search size={21} />
        </button>
      </form>
      {open && items.length > 0 && (
        <div className="search-suggestions" role="listbox" id={id}>
          {items.map((item, index) => (
            <Link
              role="option"
              aria-selected={index === active}
              id={`${id}-${index}`}
              key={item.slug}
              href={`/product/${item.slug}`}
              onClick={() => setOpen(false)}
            >
              <Search size={15} />
              <span>{item.name}</span>
              <ArrowUpRight size={14} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

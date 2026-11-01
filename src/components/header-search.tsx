"use client";
import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { t } from "@/i18n";
type Suggestion = { name: string; slug: string };
export function HeaderSearch() {
  const [q, setQ] = useState(""); const [items, setItems] = useState<Suggestion[]>([]); const [open, setOpen] = useState(false); const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { if (timer.current) clearTimeout(timer.current); if (q.trim().length < 2) { setItems([]); return; } timer.current = setTimeout(async () => { const response = await fetch(`/api/public/catalog/suggestions?q=${encodeURIComponent(q)}`); if (response.ok) { const data = await response.json() as { items: Suggestion[] }; setItems(data.items); setOpen(true); } }, 180); return () => { if (timer.current) clearTimeout(timer.current); }; }, [q]);
  return <div className="header-search-wrap"><form action="/catalog" className="header-search"><Search size={17} aria-hidden="true" /><input name="q" value={q} onChange={(event) => setQ(event.target.value)} onFocus={() => items.length && setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} autoComplete="off" role="combobox" aria-label={t("common.search")} aria-expanded={open} aria-controls="search-suggestions" placeholder={t("common.searchPlaceholder")} /></form>{open && items.length > 0 && <div className="search-suggestions" id="search-suggestions">{items.map((item) => <Link key={item.slug} href={`/product/${item.slug}`}><Search size={14} />{item.name}</Link>)}</div>}</div>;
}

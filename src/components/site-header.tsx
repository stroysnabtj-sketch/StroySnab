"use client";
import { useLocale } from "@/i18n/provider";
import { LanguageSwitch } from "./language-switch";
import Link from "next/link";
import { PanelsTopLeft, MapPin, Menu, Search, ShoppingCart, UserRound, X } from "lucide-react";
import { HeaderSearch } from "@/components/header-search";
import { useEffect, useState } from "react";
export function SiteHeader({ className = "" }: { className?: string }) {
  const { tr } = useLocale();
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [searchPinned, setSearchPinned] = useState(false);
  useEffect(() => {
    if (searchPinned)
      document
        .querySelector<HTMLInputElement>(".site-header .header-search input")
        ?.focus({ preventScroll: true });
  }, [searchPinned]);
  useEffect(() => {
    const update = () => {
      if (searchPinned && window.scrollY >= 32) return;
      if (window.scrollY < 32) setSearchPinned(false);
      if (document.activeElement?.closest(".header-search-wrap")) return;
      if (window.scrollY > 160) setCompact(true);
      else if (window.scrollY < 32) setCompact(false);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [searchPinned]);
  const [session, setSession] = useState<{ role?: string; cartCount?: number }>({});
  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => {
      fetch("/api/auth/me", { signal: controller.signal, cache: "no-store" })
        .then((r) => (r.ok ? r.json() : {}))
        .then(setSession)
        .catch(() => {});
    };
    refresh();
    window.addEventListener("cartUpdated", refresh);
    return () => {
      controller.abort();
      window.removeEventListener("cartUpdated", refresh);
    };
  }, []);
  const staff =
    session.role &&
    !session.role.startsWith("SUPPLIER_") &&
    session.role !== "CUSTOMER" &&
    session.role !== "GUEST";
  const accountHref = staff ? "/admin" : "/account";
  return (
    <header className={`site-header ${compact ? "header-compact" : ""} ${className}`}>
      <div className="header-utility">
        <div className="shell">
          <span>
            <MapPin size={13} /> {tr("Таджикистан")}
          </span>
          <nav aria-label={tr("Информация")}>
            <Link href="/delivery">{tr("Доставка и оплата")}</Link>
            <Link href="/contacts">{tr("Контакты")}</Link>
          </nav>
        </div>
      </div>
      <div className="shell header-inner">
        <Link href="/" className="brand" aria-label={tr("Stroysnab.tj — на главную")}>
          <span className="brand-mark">S</span>
          <span>
            STROYSNAB<small>.TJ</small>
          </span>
        </Link>
        <Link className="header-catalog-button" href="/catalog">
          <PanelsTopLeft size={18} /> {tr("Каталог")}
        </Link>
        <HeaderSearch />
        <div className="header-actions">
          <LanguageSwitch />
          {compact && (
            <button
              className="header-search-toggle"
              aria-label={tr("Открыть поиск")}
              onClick={() => {
                setSearchPinned(true);
                setCompact(false);
              }}
            >
              <Search size={20} />
            </button>
          )}
          <Link className="header-action" href={accountHref}>
            <UserRound size={21} />
            <span>{staff ? tr("Управление") : tr("Кабинет")}</span>
          </Link>
          <Link className="header-action" href="/cart">
            <span className="cart-icon-wrap" data-cart-target>
              <ShoppingCart size={21} />
              {Boolean(session.cartCount) && (
                <span className="cart-counter">{session.cartCount}</span>
              )}
            </span>
            <span>{tr("Корзина")}</span>
          </Link>
          <button
            className="menu-button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-site-nav"
            aria-label={open ? tr("Закрыть меню") : tr("Открыть меню")}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="mobile-site-nav shell" id="mobile-site-nav" aria-label={tr("Меню")}>
          <Link href="/catalog" onClick={() => setOpen(false)}>
            {tr("Каталог")}
          </Link>
          <Link href={accountHref} onClick={() => setOpen(false)}>
            {staff ? tr("Управление") : tr("Личный кабинет")}
          </Link>
          <Link href="/catalog/request">{tr("Заявка на товар")}</Link>
          <Link href="/delivery">{tr("Доставка и оплата")}</Link>
          <Link href="/contacts">{tr("Контакты")}</Link>
        </nav>
      )}
    </header>
  );
}

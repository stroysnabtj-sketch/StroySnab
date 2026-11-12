"use client";
import Link from "next/link";
import { PanelsTopLeft, MapPin, Menu, ShoppingCart, UserRound, X } from "lucide-react";
import { HeaderSearch } from "@/components/header-search";
import { useEffect, useState } from "react";
export function SiteHeader({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
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
    <header className={`site-header ${className}`}>
      <div className="header-utility">
        <div className="shell">
          <span>
            <MapPin size={13} /> Таджикистан
          </span>
          <nav aria-label="Информация">
            <Link href="/delivery">Доставка и оплата</Link>
            <Link href="/contacts">Контакты</Link>
          </nav>
        </div>
      </div>
      <div className="shell header-inner">
        <Link href="/" className="brand" aria-label="Stroysnab.tj — на главную">
          <span className="brand-mark">S</span>
          <span>
            STROYSNAB<small>.TJ</small>
          </span>
        </Link>
        <Link className="header-catalog-button" href="/catalog">
          <PanelsTopLeft size={18} /> Каталог
        </Link>
        <HeaderSearch />
        <div className="header-actions">
          <Link className="header-action" href={accountHref}>
            <UserRound size={21} />
            <span>{staff ? "Управление" : "Кабинет"}</span>
          </Link>
          <Link className="header-action" href="/cart">
            <span className="cart-icon-wrap" data-cart-target>
              <ShoppingCart size={21} />
              {Boolean(session.cartCount) && (
                <span className="cart-counter">{session.cartCount}</span>
              )}
            </span>
            <span>Корзина</span>
          </Link>
          <button
            className="menu-button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-site-nav"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="mobile-site-nav shell" id="mobile-site-nav" aria-label="Меню">
          <Link href="/catalog" onClick={() => setOpen(false)}>
            Каталог
          </Link>
          <Link href={accountHref} onClick={() => setOpen(false)}>
            {staff ? "Управление" : "Личный кабинет"}
          </Link>
          <Link href="/catalog/request">Заявка на товар</Link>
          <Link href="/delivery">Доставка и оплата</Link>
          <Link href="/contacts">Контакты</Link>
        </nav>
      )}
    </header>
  );
}

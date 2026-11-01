"use client";
import Link from "next/link";
import { Menu, ShoppingCart, UserRound, X } from "lucide-react";
import { HeaderSearch } from "@/components/header-search";
import { useState } from "react";
import { t } from "@/i18n";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return <header className="site-header"><div className="shell header-inner">
    <Link href="/" className="brand" aria-label="STROYHUB.TJ — на главную"><span className="brand-mark">K</span><span>STROYHUB<small>.TJ</small></span></Link>
    <nav className={`main-nav ${open ? "is-open" : ""}`} aria-label="Основная навигация">
      <Link href="/catalog" onClick={() => setOpen(false)}>{t("common.catalog")}</Link>
      <Link href="/delivery" onClick={() => setOpen(false)}>{t("common.delivery")}</Link>
      <Link href="/contacts" onClick={() => setOpen(false)}>{t("common.contacts")}</Link>
      <Link href="/catalog/request" className="nav-request" onClick={() => setOpen(false)}>Оставить заявку</Link>
    </nav>
    <HeaderSearch />
    <div className="header-actions"><Link className="icon-link" href="/account" aria-label={t("common.account")}><UserRound size={20} /></Link><Link className="icon-link" href="/cart" aria-label={t("common.cart")}><ShoppingCart size={20} /></Link><button className="menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? t("common.close") : t("common.menu")}>{open ? <X /> : <Menu />}</button></div>
  </div></header>;
}

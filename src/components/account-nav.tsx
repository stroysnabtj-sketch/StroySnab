"use client";
import { useLocale } from "@/i18n/provider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  UserRound,
  UsersRound,
  ShoppingBag,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  Menu,
  ChevronDown,
} from "lucide-react";
import { LogoutButton } from "./auth/logout-button";
import styles from "./account.module.css";

export function AccountNav({ identity }: { identity?: string }) {
  const { tr } = useLocale();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setOpen(false);
  }, [path]);
  const primaryLinks = [
    { href: "/account", label: "Обзор", icon: LayoutDashboard },
    { href: "/account/orders", label: "Заказы", icon: ShoppingBag },
    { href: "/account/requests", label: "Заявки", icon: ClipboardList },
    { href: "/account/profile", label: "Профиль", icon: UserRound },
  ];
  const secondaryLinks = [
    { href: "/account/addresses", label: "Адреса", icon: MapPin },
    { href: "/account/referral", label: "Рефералы", icon: UsersRound },
  ];
  const isActive = (href: string) =>
    href === "/account"
      ? path === href
      : path === href ||
        path.startsWith(`${href}/`) ||
        (href === "/account/requests" && path.startsWith("/account/procurement"));
  const secondaryActive = secondaryLinks.some((item) => isActive(item.href));
  return (
    <aside className={styles.accountSidebar}>
      <button
        ref={trigger}
        type="button"
        className={styles.mobileNavToggle}
        aria-expanded={open}
        aria-controls="account-navigation"
        onClick={() => setOpen(!open)}
      >
        <Menu size={18} aria-hidden="true" /> {tr("Меню кабинета")}{" "}
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      <div
        className={`${styles.sidebarBody} ${open ? styles.sidebarOpen : ""}`}
        id="account-navigation"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            trigger.current?.focus();
          }
        }}
      >
        <span className={styles.sidebarTitle}>{tr("Мой кабинет")}</span>
        <nav className={styles.nav} aria-label={tr("Личный кабинет")}>
          {primaryLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined}>
              <Icon size={18} aria-hidden="true" />
              {tr(label)}
            </Link>
          ))}
          <details className={styles.navMore} open={secondaryActive}>
            <summary>{tr("Ещё")}</summary>
            <div className={styles.navMoreList}>
              {secondaryLinks.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined}>
                  <Icon size={18} aria-hidden="true" />
                  {tr(label)}
                </Link>
              ))}
            </div>
          </details>
        </nav>
        <div className={styles.sidebarBottom}>
          {identity && <span>{identity}</span>}
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  UserRound,
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
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setOpen(false);
  }, [path]);
  const links = [
    { href: "/account", label: "Обзор", icon: LayoutDashboard },
    { href: "/account/requests", label: "Заявки", icon: ClipboardList },
    { href: "/account/orders", label: "Заказы", icon: ShoppingBag },
    { href: "/account/addresses", label: "Адреса", icon: MapPin },
    { href: "/account/profile", label: "Профиль", icon: UserRound },
  ];
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
        <Menu size={18} aria-hidden="true" /> Меню кабинета{" "}
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
        <span className={styles.sidebarTitle}>Мой кабинет</span>
        <nav className={styles.nav} aria-label="Личный кабинет">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/account"
                ? path === href
                : path === href ||
                  path.startsWith(`${href}/`) ||
                  (href === "/account/requests" && path.startsWith("/account/procurement"));
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined}>
                <Icon size={18} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className={styles.sidebarBottom}>
          {identity && <span>{identity}</span>}
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}

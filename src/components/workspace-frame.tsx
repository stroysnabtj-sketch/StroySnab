"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, Menu, X, UserRound } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import styles from "./workspace-design.module.css";
export function WorkspaceFrame({
  kind,
  role,
  identity,
  navigation,
  menu,
  children,
}: {
  kind: "admin" | "seller";
  role: string;
  identity: string;
  navigation: { href: string; label: string }[];
  menu: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const current = [...navigation]
    .reverse()
    .find((link) => pathname === link.href || pathname.startsWith(link.href + "/"));
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    else if (!open && dialog.current?.open) {
      dialog.current.close();
      trigger.current?.focus();
    }
  }, [open]);
  const brand = (
    <Link href={kind === "admin" ? "/admin" : "/seller"} className={styles.brand}>
      <span>S</span>
      <strong>
        STROYSNAB<small>.TJ</small>
      </strong>
    </Link>
  );
  return (
    <div className={`workspace ${styles.workspace}`}>
      <aside className={`workspace-side ${styles.sidebar}`}>
        {brand}
        <div className={styles.sideCaption}>
          {kind === "admin" ? "Управление платформой" : "Кабинет магазина"}
        </div>
        {menu}
        <div className={styles.sideBottom}>
          <span className={styles.roleDot} />
          {role}
          <Link href="/">
            Открыть сайт <ArrowUpRight size={15} />
          </Link>
        </div>
      </aside>
      <div className={`workspace-main ${styles.main}`}>
        <header className={`workspace-top ${styles.topbar}`}>
          <div className={styles.topLeft}>
            <button
              ref={trigger}
              className={styles.menuButton}
              type="button"
              aria-label="Открыть меню управления"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Menu size={22} />
            </button>
            <Link href={kind === "admin" ? "/admin" : "/seller"}>
              {kind === "admin" ? "Платформа" : "Мой магазин"}
            </Link>
            <ChevronRight size={14} />
            <span>{current?.label ?? "Обзор"}</span>
          </div>
          <div className={styles.identity}>
            <span className={styles.avatar}>
              <UserRound size={18} />
            </span>
            <div>
              <strong>{role}</strong>
              <small>{identity}</small>
            </div>
            <LogoutButton />
          </div>
        </header>
        <main className={`workspace-content ${styles.content}`} id="workspace-content">
          {children}
        </main>
      </div>
      <dialog
        ref={dialog}
        className={styles.mobileMenu}
        aria-label="Меню управления"
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
      >
        <div className={styles.mobileMenuHead}>
          {brand}
          <button type="button" aria-label="Закрыть меню" onClick={() => setOpen(false)}>
            <X size={22} />
          </button>
        </div>
        <div className={styles.sideCaption}>{role}</div>
        <div
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          {menu}
        </div>
        <Link href="/" className={styles.menuStore}>
          Открыть сайт <ArrowUpRight size={16} />
        </Link>
      </dialog>
    </div>
  );
}

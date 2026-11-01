import Link from "next/link";
import { Search } from "lucide-react";
import { t } from "@/i18n";

export function Workspace({ kind, children }: { kind: "admin" | "seller"; children: React.ReactNode }) {
  const title = kind === "admin" ? t("admin.dashboard") : t("seller.dashboard");
  const base = `/${kind}`;
  return <div className="workspace"><aside className="workspace-side"><Link href="/" className="brand workspace-brand"><span className="brand-mark">K</span><span>STROYHUB<small>.TJ</small></span></Link><div className="workspace-caption">{kind === "admin" ? "УПРАВЛЕНИЕ" : "ПОСТАВЩИК"}</div><nav><Link href={base}>{title}</Link>{kind === "admin" ? <><Link href="/admin/catalog">Каталог</Link><Link href="/admin/categories">Категории</Link><Link href="/admin/suppliers">Поставщики</Link><Link href="/admin/offers">Предложения</Link><Link href="/admin/pricing">Цены</Link><Link href="/admin/users">Пользователи</Link></> : null}</nav><Link className="workspace-store" href="/">← На витрину</Link></aside><div className="workspace-main"><header className="workspace-top"><form action={base}><Search size={17} /><input name="q" placeholder={kind === "admin" ? t("admin.search") : t("seller.search")} aria-label="Поиск" /></form><span className="workspace-role">{kind === "admin" ? "SUPER ADMIN" : "SUPPLIER OWNER"}</span></header><main className="workspace-content">{children}</main></div></div>;
}

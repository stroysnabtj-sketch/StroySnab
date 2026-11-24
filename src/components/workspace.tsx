import {
  LayoutDashboard,
  Package,
  Store,
  Tags,
  ClipboardList,
  Users,
  ShoppingBag,
  FolderTree,
  SlidersHorizontal,
  History,
  Truck,
  Bell,
  Gift,
} from "lucide-react";
import { getCurrentUser } from "@/modules/auth/session";
import { hasPermission, type Permission } from "@/modules/rbac/permissions";
import { ROLE_LABELS } from "@/modules/system/admin-labels";
import { WorkspaceFrame } from "@/components/workspace-frame";
import { WorkspaceNavGroup, WorkspaceNavLink } from "@/components/workspace-nav-link";
export async function Workspace({
  kind,
  children,
  newRequestsCount,
}: {
  kind: "admin";
  children: React.ReactNode;
  newRequestsCount?: number;
}) {
  const user = await getCurrentUser();
  const adminLinks: {
    href: string;
    label: string;
    permission: Permission;
    icon: typeof Package;
  }[] = [
    { href: "/admin", label: "Обзор", permission: "catalog:read", icon: LayoutDashboard },
    {
      href: "/admin/notifications",
      label: "Уведомления",
      permission: "orders:manage",
      icon: Bell,
    },
    { href: "/admin/orders", label: "Заказы", permission: "orders:read", icon: ShoppingBag },
    {
      href: "/admin/procurement",
      label: "Закупки и КП",
      permission: "product_requests:manage",
      icon: ClipboardList,
    },
    { href: "/admin/deliveries", label: "Доставки", permission: "deliveries:manage", icon: Truck },
    {
      href: "/admin/home-collections",
      label: "Акции и новинки",
      permission: "catalog:manage",
      icon: Tags,
    },
    { href: "/admin/catalog", label: "Товары", permission: "catalog:manage", icon: Package },
    {
      href: "/admin/categories",
      label: "Категории",
      permission: "catalog:manage",
      icon: FolderTree,
    },
    { href: "/admin/suppliers", label: "Поставщики", permission: "suppliers:manage", icon: Store },
    { href: "/admin/offers", label: "Предложения", permission: "suppliers:manage", icon: Tags },
    {
      href: "/admin/pricing",
      label: "Правила цен",
      permission: "pricing:manage",
      icon: SlidersHorizontal,
    },
    {
      href: "/admin/ai-providers",
      label: "Провайдер AI-КП",
      permission: "settings:manage",
      icon: SlidersHorizontal,
    },
    {
      href: "/admin/referrals",
      label: "Рефералы и бонусы",
      permission: "settings:manage",
      icon: Gift,
    },
    {
      href: "/admin/product-requests",
      label: "Заявки на товары",
      permission: "product_requests:manage",
      icon: ClipboardList,
    },
    { href: "/admin/users", label: "Пользователи", permission: "users:manage", icon: Users },
    { href: "/admin/audit", label: "Журнал действий", permission: "audit:read", icon: History },
  ];
  const links = adminLinks.filter((l) => user && hasPermission(user.role, l.permission));
  const groups = [
    {
      label: "Продажи",
      hrefs: ["/admin/orders", "/admin/procurement", "/admin/product-requests", "/admin/deliveries"],
    },
    {
      label: "Каталог",
      hrefs: ["/admin/catalog", "/admin/categories", "/admin/home-collections", "/admin/suppliers", "/admin/offers", "/admin/pricing"],
    },
    {
      label: "Управление",
      hrefs: ["/admin/ai-providers", "/admin/notifications", "/admin/referrals", "/admin/users", "/admin/audit"],
    },
  ];
  const role = user ? ROLE_LABELS[user.role] : "Сотрудник";
  const renderLink = (link: (typeof links)[number]) => (
    <WorkspaceNavLink key={link.href} href={link.href}>
      <link.icon size={18} />
      <span>{link.label}</span>
      {link.href === "/admin/product-requests" && Boolean(newRequestsCount) && (
        <span className="badge">{newRequestsCount}</span>
      )}
    </WorkspaceNavLink>
  );
  const menu = (
    <nav aria-label={"Управление магазином"}>
      {links.filter((link) => link.href === "/admin").map(renderLink)}
      {groups.map(({ label, hrefs }, index) => {
        const groupLinks = hrefs.flatMap((href) => links.filter((link) => link.href === href));
        if (!groupLinks.length) return null;
        return (
          <WorkspaceNavGroup
            key={label}
            label={label}
            hrefs={groupLinks.map((link) => link.href)}
            openOnOverview={index === 0}
          >
            {groupLinks.map(renderLink)}
          </WorkspaceNavGroup>
        );
      })}
    </nav>
  );
  return (
    <WorkspaceFrame
      kind={kind}
      role={role}
      identity={user?.email ?? user?.phone ?? ""}
      navigation={links.map(({ href, label }) => ({ href, label }))}
      menu={menu}
    >
      {children}
    </WorkspaceFrame>
  );
}

import { Workspace } from "@/components/workspace";
import { AdminCatalogPanel } from "@/components/admin-catalog-panel";
import { requirePageUser } from "@/modules/auth/page";
import { ROLES } from "@/modules/rbac/permissions";
export const dynamic = "force-dynamic";
export default async function AdminCatalogPage() { await requirePageUser([...ROLES.filter((role) => ["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"].includes(role))], "/admin/catalog"); return <Workspace kind="admin"><h1>Каталог товаров</h1><AdminCatalogPanel /></Workspace>; }

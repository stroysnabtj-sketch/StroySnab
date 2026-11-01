import { Workspace } from "@/components/workspace";
import { AdminCategoriesPanel } from "@/components/admin-categories-panel";
import { requirePageUser } from "@/modules/auth/page";
import { ROLES } from "@/modules/rbac/permissions";
export const dynamic = "force-dynamic";
export default async function AdminCategoriesPage() { await requirePageUser([...ROLES.filter((role) => ["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"].includes(role))], "/admin/categories"); return <Workspace kind="admin"><h1>Категории</h1><AdminCategoriesPanel /></Workspace>; }

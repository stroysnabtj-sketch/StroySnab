import { Workspace } from "@/components/workspace";
import { AdminSuppliersPanel } from "@/components/admin-suppliers-panel";
import { requirePageUser } from "@/modules/auth/page";
import { ROLES } from "@/modules/rbac/permissions";
export const dynamic = "force-dynamic";
export default async function AdminSuppliersPage() { await requirePageUser([...ROLES.filter((role) => ["ADMIN", "SUPER_ADMIN", "PROCUREMENT_MANAGER"].includes(role))], "/admin/suppliers"); return <Workspace kind="admin"><h1>Поставщики</h1><AdminSuppliersPanel /></Workspace>; }

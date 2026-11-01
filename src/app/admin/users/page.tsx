import { Workspace } from "@/components/workspace";
import { AdminUsersPanel } from "@/components/admin-users-panel";
import { requirePageUser } from "@/modules/auth/page";
import { ROLES } from "@/modules/rbac/permissions";
export const dynamic = "force-dynamic";
export default async function AdminUsersPage() { await requirePageUser([...ROLES.filter((r) => ["ADMIN", "SUPER_ADMIN"].includes(r))], "/admin/users"); return <Workspace kind="admin"><h1>Пользователи</h1><AdminUsersPanel /></Workspace>; }

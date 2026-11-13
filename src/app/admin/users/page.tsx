import { Workspace } from "@/components/workspace";
import { AdminUsersPanel } from "@/components/admin-users-panel";
import { requirePagePermission } from "@/modules/auth/page";
import { hasPermission } from "@/modules/rbac/permissions";
import styles from "@/components/workspace-design.module.css";
export const dynamic = "force-dynamic";
export default async function AdminUsersPage() {
  const actor = await requirePagePermission("users:manage", "/admin/users");
  return (
    <Workspace kind="admin">
      <header className={styles.pageHeading}>
        <div>
          <h1>Пользователи и доступы</h1>
          <p>Покупатели и сотрудники StroySnab.</p>
        </div>
      </header>
      <AdminUsersPanel
        actorId={actor.id}
        canManageAdmins={hasPermission(actor.role, "admins:manage")}
      />
    </Workspace>
  );
}

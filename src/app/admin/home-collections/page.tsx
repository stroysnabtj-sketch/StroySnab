import { Workspace } from "@/components/workspace";
import { AdminHomeCollectionsPanel } from "@/components/admin-home-collections-panel";
import { AdminHomeContentPanel } from "@/components/admin-home-content-panel";
import { requirePagePermission } from "@/modules/auth/page";
import styles from "@/components/workspace-design.module.css";

export const dynamic = "force-dynamic";
export default async function AdminHomeCollectionsPage() {
  await requirePagePermission("catalog:manage", "/admin/home-collections");
  return (
    <Workspace kind="admin">
      <header className={styles.pageHeading}>
        <div>
          <h1>Главная страница</h1>
        </div>
      </header>
      <AdminHomeCollectionsPanel />
      <div style={{ marginTop: 28 }}>
        <AdminHomeContentPanel />
      </div>
    </Workspace>
  );
}

import { Workspace } from "@/components/workspace";
import { AdminHomeCollectionsPanel } from "@/components/admin-home-collections-panel";
import { requirePagePermission } from "@/modules/auth/page";
import styles from "@/components/workspace-design.module.css";

export const dynamic = "force-dynamic";
export default async function AdminHomeCollectionsPage() {
  await requirePagePermission("catalog:manage", "/admin/home-collections");
  return (
    <Workspace kind="admin">
      <header className={styles.pageHeading}>
        <div>
          <h1>Подборки главной</h1>
          <p>Выберите до 12 товаров и настройте порядок в каждой подборке.</p>
        </div>
      </header>
      <AdminHomeCollectionsPanel />
    </Workspace>
  );
}

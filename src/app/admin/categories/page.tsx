import { Workspace } from "@/components/workspace";
import { AdminCategoriesPanel } from "@/components/admin-categories-panel";
import { requirePagePermission } from "@/modules/auth/page";
import styles from "@/components/workspace-design.module.css";
export const dynamic = "force-dynamic";
export default async function AdminCategoriesPage() {
  await requirePagePermission("catalog:manage", "/admin/categories");
  return (
    <Workspace kind="admin">
      <header className={styles.pageHeading}>
        <div>
          <h1>Категории</h1>
          <p>Дерево каталога и характеристики товарных групп.</p>
        </div>
      </header>
      <AdminCategoriesPanel />
    </Workspace>
  );
}

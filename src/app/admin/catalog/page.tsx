import { Workspace } from "@/components/workspace";
import { AdminCatalogPanel } from "@/components/admin-catalog-panel";
import { requirePagePermission } from "@/modules/auth/page";
import styles from "@/components/workspace-design.module.css";
export const dynamic = "force-dynamic";
export default async function AdminCatalogPage() {
  await requirePagePermission("catalog:manage", "/admin/catalog");
  return (
    <Workspace kind="admin">
      <header className={styles.pageHeading}>
        <div>
          <h1>Каталог товаров</h1>
          <p>Карточки товаров, публикация и модерация ассортимента.</p>
        </div>
      </header>
      <AdminCatalogPanel />
    </Workspace>
  );
}

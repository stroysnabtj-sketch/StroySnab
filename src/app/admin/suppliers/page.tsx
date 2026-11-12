import { Workspace } from "@/components/workspace";
import { AdminSuppliersPanel } from "@/components/admin-suppliers-panel";
import { requirePagePermission } from "@/modules/auth/page";
import styles from "@/components/workspace-design.module.css";
export const dynamic = "force-dynamic";
export default async function AdminSuppliersPage() {
  await requirePagePermission("suppliers:manage", "/admin/suppliers");
  return (
    <Workspace kind="admin">
      <header className={styles.pageHeading}>
        <div>
          <h1>Поставщики</h1>
          <p>Контакты поставщиков и источники закупки товаров.</p>
        </div>
      </header>
      <AdminSuppliersPanel />
    </Workspace>
  );
}

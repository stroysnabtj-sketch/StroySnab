import { Workspace } from "@/components/workspace";
import { AdminOffersPanel } from "@/components/admin-offers-panel";
import { requirePagePermission } from "@/modules/auth/page";
import styles from "@/components/workspace-design.module.css";
export const dynamic = "force-dynamic";
export default async function AdminOffersPage() {
  await requirePagePermission("suppliers:manage", "/admin/offers");
  return (
    <Workspace kind="admin">
      <header className={styles.pageHeading}>
        <div>
          <h1>Предложения магазинов</h1>
          <p>Цены, остатки, резерв и сроки поставки.</p>
        </div>
      </header>
      <AdminOffersPanel />
    </Workspace>
  );
}

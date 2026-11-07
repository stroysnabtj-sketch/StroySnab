import { Workspace } from "@/components/workspace";
import { AdminPricingPanel } from "@/components/admin-pricing-panel";
import { requirePagePermission } from "@/modules/auth/page";
import styles from "@/components/workspace-design.module.css";
export const dynamic = "force-dynamic";
export default async function AdminPricingPage() {
  await requirePagePermission("pricing:manage", "/admin/pricing");
  return (
    <Workspace kind="admin">
      <header className={styles.pageHeading}>
        <div>
          <h1>Ценообразование</h1>
          <p>Наценка платформы и предварительный расчёт суммы заказа.</p>
        </div>
      </header>
      <AdminPricingPanel />
    </Workspace>
  );
}

import { Workspace } from "@/components/workspace";
import { AdminReferralsPanel } from "@/components/admin-referrals-panel";
import { requirePagePermission } from "@/modules/auth/page";
import { listAdminReferrals } from "@/modules/referrals/service";
import styles from "@/components/workspace-design.module.css";

export const dynamic = "force-dynamic";

export default async function AdminReferralsPage() {
  await requirePagePermission("settings:manage", "/admin/referrals");
  const data = await listAdminReferrals();
  return (
    <Workspace kind="admin">
      <header className={styles.pageHeading}>
        <div>
          <h1>Рефералы и бонусы</h1>
          <p>Ставка начисления реферального вознаграждения и журнал бонусов.</p>
        </div>
      </header>
      <AdminReferralsPanel initialData={data} />
    </Workspace>
  );
}

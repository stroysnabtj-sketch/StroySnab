import { Workspace } from "@/components/workspace";
import { SellerInvitation } from "@/components/seller-invitation";
import { requirePageUser } from "@/modules/auth/page";
import { getShopTeam } from "@/modules/suppliers/shop-service";
import styles from "@/components/seller-workspace.module.css";
export const dynamic = "force-dynamic";
export default async function TeamPage() {
  const actor = await requirePageUser(["SUPPLIER_OWNER"], "/seller/team");
  const { members, role } = await getShopTeam(actor);
  return (
    <Workspace kind="seller">
      <div className={styles.root}>
        <div className={styles.heading}>
          <div>
            <h1>Команда магазина</h1>
            <p>Сотрудники с доступом к вашему магазину</p>
          </div>
        </div>
        <section className={styles.panel}>
          {members.map((member) => (
            <div key={member.id} className={styles.row}>
              <strong>{member.email ?? member.phone}</strong>
              <span>{member.phone}</span>
              <span className={styles.badge}>
                {member.role === "OWNER" ? "Владелец" : "Сотрудник"}
              </span>
              <span>{member.status === "ACTIVE" ? "Активен" : "Приостановлен"}</span>
            </div>
          ))}
        </section>
        {role === "OWNER" && <SellerInvitation />}
      </div>
    </Workspace>
  );
}

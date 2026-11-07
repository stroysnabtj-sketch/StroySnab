import { requirePagePermission } from "@/modules/auth/page";
import { Workspace } from "@/components/workspace";
import { ProcurementList } from "@/components/procurement/request-list";
import s from "@/components/procurement/procurement.module.css";
export const dynamic = "force-dynamic";
export const metadata = { title: "Закупочные заявки и КП" };
export default async function Page() {
  await requirePagePermission("product_requests:manage", "/admin/procurement");
  return (
    <Workspace kind="admin">
      <header className={s.head}>
        <div>
          <span className="eyebrow">Закупки</span>
          <h1>Заявки и КП</h1>
          <p>Проверьте списки материалов, подготовьте предложение и отслеживайте оплату.</p>
        </div>
      </header>
      <ProcurementList manager />
    </Workspace>
  );
}

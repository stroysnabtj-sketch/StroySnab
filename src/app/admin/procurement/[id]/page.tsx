import { requirePagePermission } from "@/modules/auth/page";
import { Workspace } from "@/components/workspace";
import { ProcurementDetail } from "@/components/procurement/request-detail";
export const dynamic = "force-dynamic";
export const metadata = { title: "Управление закупочной заявкой" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePagePermission("product_requests:manage", `/admin/procurement/${id}`);
  return (
    <Workspace kind="admin">
      <ProcurementDetail id={id} manager />
    </Workspace>
  );
}

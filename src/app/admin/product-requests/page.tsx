import { requirePageUser } from "@/modules/auth/page";
import { listManagedRequests } from "@/modules/product-requests/service";
import { Workspace } from "@/components/workspace";
import { AdminProductRequestsPanel } from "@/components/admin-product-requests-panel";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Управление заявками на товары",
};

export default async function AdminProductRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string; sort?: string }>;
}) {
  const user = await requirePageUser(["SALES_MANAGER", "PROCUREMENT_MANAGER", "ADMIN", "SUPER_ADMIN"], "/admin/product-requests");
  const params = await searchParams;

  const page = Number(params.page) || 1;
  const status = params.status || undefined;
  const q = params.q || undefined;
  const sort = params.sort || undefined;

  const { items, total, pageSize, newCount } = await listManagedRequests(user, {
    status,
    q,
    page,
    pageSize: 25,
    sort,
  });

  return (
    <Workspace kind="admin" newRequestsCount={newCount}>
      <header className="page-head" style={{ marginBottom: "20px" }}>
        <div>
          <span className="eyebrow">Заявки на отсутствующие товары</span>
          <h1>Заявки ({total})</h1>
        </div>
      </header>

      <AdminProductRequestsPanel
        items={items}
        total={total}
        page={page}
        pageSize={pageSize}
        status={status}
        q={q}
      />
    </Workspace>
  );
}


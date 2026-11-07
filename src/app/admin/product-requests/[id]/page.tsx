import { notFound } from "next/navigation";
import { requirePageUser } from "@/modules/auth/page";
import { getManagedRequest } from "@/modules/product-requests/service";
import { Workspace } from "@/components/workspace";
import { ProductRequestRespond } from "@/components/product-request-respond";
import { ApiError } from "@/server/api-error";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Карточка заявки на товар",
};

export default async function AdminProductRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageUser(
    ["SALES_MANAGER", "PROCUREMENT_MANAGER", "ADMIN", "SUPER_ADMIN"],
    "/admin/product-requests"
  );
  const { id } = await params;

  let requestDetail;
  try {
    requestDetail = await getManagedRequest(user, id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  return (
    <Workspace kind="admin">
      <header className="page-head" style={{ marginBottom: "20px" }}>
        <div>
          <span className="eyebrow">Обработка заявки</span>
          <h1>Заявка {requestDetail.number}</h1>
        </div>
      </header>

      <ProductRequestRespond request={requestDetail} isAdmin={isAdmin} />
    </Workspace>
  );
}


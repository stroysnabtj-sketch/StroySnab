import { notFound } from "next/navigation";
import { requirePageUser } from "@/modules/auth/page";
import { getOwnRequest } from "@/modules/product-requests/service";
import { ApiError } from "@/server/api-error";
import { CustomerWorkspace } from "@/components/customer-workspace";
import { CustomerRequestsPanel } from "@/components/customer-requests-panel";
export const dynamic = "force-dynamic";
export const metadata = { title: "Заявка — Stroysnab.tj" };

export default async function CustomerRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requirePageUser(["CUSTOMER"], `/account/requests/${id}`);
  const request = await getOwnRequest(user.id, id).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });
  return (
    <CustomerWorkspace title={`Заявка ${request.number}`} identity={user.phone}>
      <CustomerRequestsPanel request={request} />
    </CustomerWorkspace>
  );
}

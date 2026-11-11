import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { currentUserId } from "@/modules/cart/service";
import { optionalUser } from "@/modules/auth/session";
import { hasPermission } from "@/modules/rbac/permissions";
import { getManagedOrder, getOrder } from "@/modules/orders/service";
import { OrderStatusDashboard } from "@/components/order-status-dashboard";
import { getOrderPaymentSummary } from "@/modules/orders/payment-service";
import { customerOrderView } from "@/modules/orders/customer-view";

export const metadata: Metadata = {
  title: "Статус заказа | Stroysnab.tj",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ access?: string }>;
}) {
  const [{ id }, { access }] = await Promise.all([params, searchParams]);
  if (typeof access === "string" && access)
    redirect(`/orders/${encodeURIComponent(id)}/access?token=${encodeURIComponent(access)}`);
  const jar = await cookies();
  const actor = await optionalUser();
  const order =
    actor && hasPermission(actor.role, "orders:read")
      ? await getManagedOrder(actor, id)
      : await getOrder(id, {
          userId: await currentUserId(),
          guestToken: jar.get(`kh_order_${id}`)?.value,
        });

  if (!order) notFound();
  const payment = await getOrderPaymentSummary(id);

  return (
    <>
      <SiteHeader />
      <main className="shell">
        <OrderStatusDashboard
          order={customerOrderView(order)}
          guestRegistrationHref={
            !actor && !order.customerId
              ? `/auth/register?next=${encodeURIComponent(`/orders/${order.id}`)}`
              : undefined
          }
          payment={{
            status: payment.status,
            paidDirams: payment.paidDirams,
            balanceDirams: payment.balanceDirams,
          }}
        />
      </main>
      <SiteFooter />
    </>
  );
}

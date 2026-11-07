import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CheckoutView } from "@/components/checkout-view";
import { EmptyState } from "@/components/ui";
import { currentUserId, getCart } from "@/modules/cart/service";
import { optionalUser } from "@/modules/auth/session";
import { getDb } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Оформление заказа",
  description: "Заказ строительных материалов: контакты, адрес и способ получения.",
};

export default async function CheckoutPage() {
  const jar = await cookies();
  const userId = await currentUserId();
  const user = await optionalUser();
  const guestToken = jar.get("kh_cart")?.value;

  const cart = await getCart(userId, guestToken);
  const [customer] = user?.customerId
    ? await (
        await getDb()
      )
        .select({ fullName: customers.fullName })
        .from(customers)
        .where(eq(customers.id, user.customerId))
        .limit(1)
    : [];

  return (
    <>
      <SiteHeader />
      <main className="shell checkout-page-shell">
        {cart.items.length > 0 ? (
          <CheckoutView
            initialCart={{ id: cart.id, items: cart.items, totalDirams: cart.totalDirams }}
            currentUser={
              user?.role === "CUSTOMER"
                ? {
                    phone: user?.phone,
                    fullName: customer?.fullName,
                  }
                : undefined
            }
          />
        ) : (
          <div className="empty-checkout-wrap">
            <EmptyState
              title="Ваша корзина пуста"
              text="Добавьте товары из каталога, затем укажите способ получения."
              action={
                <Link className="button button-primary" href="/catalog">
                  Перейти в каталог
                </Link>
              }
            />
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

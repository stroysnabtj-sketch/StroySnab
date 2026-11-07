import Link from "next/link";
import { cookies } from "next/headers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EmptyState } from "@/components/ui";
import { CartPanel } from "@/components/cart-panel";
import { currentUserId, getCart } from "@/modules/cart/service";
export const metadata = { title: "Корзина" };
export default async function CartPage() {
  const jar = await cookies();
  const cart = await getCart(await currentUserId(), jar.get("kh_cart")?.value);
  return (
    <>
      <SiteHeader />
      <main className="shell">
        <header className="page-head">
          <span className="eyebrow">Оформление</span>
          <h1>Корзина</h1>
        </header>
        <section className="content-section">
          {cart.items.length ? (
            <CartPanel initialItems={cart.items} totalDirams={cart.totalDirams} />
          ) : (
            <EmptyState
              title="В корзине пока ничего нет"
              text="Добавьте материалы из каталога — цены и остатки актуальны на момент заказа."
              action={
                <Link className="button button-primary" href="/catalog">
                  Перейти в каталог
                </Link>
              }
            />
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

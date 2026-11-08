import { eq } from "drizzle-orm";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProcurementRequestForm } from "@/components/procurement/request-form";
import { requirePageUser } from "@/modules/auth/page";
import { getDb } from "@/db";
import { customers } from "@/db/schema";
import s from "@/components/procurement/procurement.module.css";
export const dynamic = "force-dynamic";
export const metadata = { title: "Новая заявка — Stroysnab.tj" };
export default async function Page() {
  const user = await requirePageUser(["CUSTOMER"], "/request");
  const [customer] = await (await getDb())
    .select()
    .from(customers)
    .where(eq(customers.userId, user.id))
    .limit(1);
  return (
    <>
      <SiteHeader />
      <main className={`shell ${s.page}`}>
        <header className={s.head}>
          <h1>Новая заявка</h1>
        </header>
        <ProcurementRequestForm
          contactName={customer?.fullName ?? ""}
          contactPhone={user.phone}
          contactEmail={user.email ?? ""}
        />
      </main>
      <SiteFooter />
    </>
  );
}

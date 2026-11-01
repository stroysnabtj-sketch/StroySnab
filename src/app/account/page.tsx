import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customers } from "@/db/schema";
import { requirePageUser } from "@/modules/auth/page";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProfilePanel } from "@/components/auth/profile-panel";
import { LogoutButton } from "@/components/auth/logout-button";
export const dynamic = "force-dynamic";
export default async function AccountPage() {
  const user = await requirePageUser(["CUSTOMER"], "/account");
  const db = await getDb(); const [customer] = await db.select().from(customers).where(eq(customers.userId, user.id)).limit(1);
  return <><SiteHeader /><main className="shell"><header className="page-head account-head"><div><span className="eyebrow">Личный кабинет</span><h1>{customer?.fullName ?? user.phone}</h1></div><LogoutButton /></header><ProfilePanel initialName={customer?.fullName ?? ""} initialPhone={user.phone} /></main><SiteFooter /></>;
}

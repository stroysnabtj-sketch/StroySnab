import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customers } from "@/db/schema";
import { requirePageUser } from "@/modules/auth/page";
import { CustomerWorkspace } from "@/components/customer-workspace";
import { ProfilePanel } from "@/components/auth/profile-panel";
export const dynamic = "force-dynamic";
export const metadata = { title: "Настройки профиля — Stroysnab.tj" };
export default async function AccountProfilePage() {
  const user = await requirePageUser(["CUSTOMER"], "/account/profile");
  const db = await getDb();
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.userId, user.id))
    .limit(1);
  return (
    <CustomerWorkspace title="Профиль" identity={user.phone}>
      <ProfilePanel initialName={customer?.fullName ?? ""} initialPhone={user.phone} />
    </CustomerWorkspace>
  );
}

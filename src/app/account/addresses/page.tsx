import { requirePageUser } from "@/modules/auth/page";
import { CustomerWorkspace } from "@/components/customer-workspace";
import { AddressBook } from "@/components/address-fields";
export const dynamic = "force-dynamic";
export const metadata = { title: "Адреса — Stroysnab.tj" };
export default async function AddressesPage() {
  const user = await requirePageUser(["CUSTOMER"], "/account/addresses");
  return (
    <CustomerWorkspace title="Адреса" identity={user.phone}>
      <section className="card" style={{ padding: 24, maxWidth: 900 }}>
        <AddressBook />
      </section>
    </CustomerWorkspace>
  );
}

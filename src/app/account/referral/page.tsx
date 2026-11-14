import { requirePageUser } from "@/modules/auth/page";
import { getReferralSummary } from "@/modules/referrals/service";
import { CustomerWorkspace } from "@/components/customer-workspace";
import { ReferralPanel } from "@/components/referral-panel";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Рефералы — Stroysnab.tj",
  robots: { index: false, follow: false },
};
export default async function ReferralPage() {
  const user = await requirePageUser(["CUSTOMER"], "/account/referral");
  const summary = await getReferralSummary(user.id);
  return (
    <CustomerWorkspace title="Рефералы" identity={user.phone || user.email}>
      <ReferralPanel {...summary} />
    </CustomerWorkspace>
  );
}

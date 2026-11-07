import { optionalUser } from "@/modules/auth/session";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProcurementDetail } from "@/components/procurement/request-detail";
import s from "@/components/procurement/procurement.module.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Заявка и коммерческое предложение",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ access?: string }>;
}) {
  const [{ id }, { access }, user] = await Promise.all([params, searchParams, optionalUser()]);
  return (
    <>
      <SiteHeader />
      <main className={`shell ${s.page}`}>
        <ProcurementDetail id={id} access={access} canSaveAddress={user?.role === "CUSTOMER"} />
      </main>
      <SiteFooter />
    </>
  );
}

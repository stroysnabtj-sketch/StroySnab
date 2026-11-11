import { OpenGuestOrder } from "@/components/open-guest-order";

export const metadata = {
  title: "Статус заказа",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <OpenGuestOrder id={(await params).id} />;
}

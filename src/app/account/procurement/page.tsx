import { redirect } from "next/navigation";
import { requirePageUser } from "@/modules/auth/page";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requirePageUser(["CUSTOMER"], "/account/procurement");
  redirect("/account/requests");
}

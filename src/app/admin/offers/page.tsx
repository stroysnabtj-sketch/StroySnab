import { Workspace } from "@/components/workspace";
import { AdminOffersPanel } from "@/components/admin-offers-panel";
import { requirePageUser } from "@/modules/auth/page";
import { ROLES } from "@/modules/rbac/permissions";
export const dynamic = "force-dynamic";
export default async function AdminOffersPage() { await requirePageUser([...ROLES.filter((role) => ["ADMIN", "SUPER_ADMIN", "PROCUREMENT_MANAGER"].includes(role))], "/admin/offers"); return <Workspace kind="admin"><h1>Предложения</h1><AdminOffersPanel /></Workspace>; }

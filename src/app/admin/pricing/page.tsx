import { Workspace } from "@/components/workspace";
import { AdminPricingPanel } from "@/components/admin-pricing-panel";
import { requirePageUser } from "@/modules/auth/page";
import { ROLES } from "@/modules/rbac/permissions";
export const dynamic = "force-dynamic";
export default async function AdminPricingPage() { await requirePageUser([...ROLES.filter((role) => ["ADMIN", "SUPER_ADMIN", "PROCUREMENT_MANAGER"].includes(role))], "/admin/pricing"); return <Workspace kind="admin"><h1>Ценообразование</h1><AdminPricingPanel /></Workspace>; }

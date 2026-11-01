import { Workspace } from "@/components/workspace";
import { requirePageUser } from "@/modules/auth/page";
import { ROLES } from "@/modules/rbac/permissions";
export const dynamic = "force-dynamic";
export default async function AdminPage() { await requirePageUser([...ROLES.filter((r) => !["GUEST", "CUSTOMER", "SUPPLIER_OWNER", "SUPPLIER_STAFF"].includes(r))], "/admin"); return <Workspace kind="admin"><h1>Обзор платформы</h1><div className="metric-grid"><div className="metric"><span>Заказы за период</span><strong>0</strong></div><div className="metric"><span>Выручка</span><strong>0 TJS</strong></div><div className="metric"><span>Новые заявки</span><strong>0</strong></div><div className="metric"><span>На модерации</span><strong>0</strong></div></div></Workspace>; }

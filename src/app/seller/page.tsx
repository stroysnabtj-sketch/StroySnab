import { Workspace } from "@/components/workspace";
import { requirePageUser } from "@/modules/auth/page";
export const dynamic = "force-dynamic";
export default async function SellerPage() { await requirePageUser(["SUPPLIER_OWNER", "SUPPLIER_STAFF"], "/seller"); return <Workspace kind="seller"><h1>Кабинет поставщика</h1><div className="metric-grid"><div className="metric"><span>Новые заказы</span><strong>0</strong></div><div className="metric"><span>Заявки</span><strong>0</strong></div><div className="metric"><span>На модерации</span><strong>0</strong></div><div className="metric"><span>Низкий остаток</span><strong>0</strong></div></div></Workspace>; }

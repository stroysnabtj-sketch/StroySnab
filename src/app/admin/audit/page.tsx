import { desc, ilike, or } from "drizzle-orm";
import { Workspace } from "@/components/workspace";
import { DataTable } from "@/components/admin-ui";
import { requirePagePermission } from "@/modules/auth/page";
import { getDb } from "@/db";
import { auditLog, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatDateTime } from "@/i18n";
import styles from "@/components/workspace-design.module.css";
export const dynamic = "force-dynamic";
export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePagePermission("audit:read", "/admin/audit");
  const db = await getDb();
  const q = ((await searchParams).q ?? "").trim().slice(0, 200);
  const items = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      entity: auditLog.entity,
      entityId: auditLog.entityId,
      createdAt: auditLog.createdAt,
      actorEmail: users.email,
      actorPhone: users.phone,
    })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.actorUserId, users.id))
    .where(
      q
        ? or(
            ilike(auditLog.action, `%${q}%`),
            ilike(auditLog.entity, `%${q}%`),
            ilike(users.email, `%${q}%`),
          )
        : undefined,
    )
    .orderBy(desc(auditLog.createdAt))
    .limit(100);
  return (
    <Workspace kind="admin">
      <header className={styles.pageHeading}>
        <div>
          <h1>Журнал действий</h1>
          <p>Последние 100 событий: изменения каталога, доступов, поставщиков и заказов.</p>
        </div>
      </header>
      <form className={styles.filterForm}>
        <input
          className="input"
          name="q"
          defaultValue={q}
          aria-label="Поиск в журнале"
          placeholder="Действие, раздел или e-mail"
        />
        <button className="button button-primary">Найти</button>
      </form>
      <DataTable headers={["Событие", "Раздел", "Сотрудник", "Время"]}>
        {items.map((item) => (
          <tr key={item.id}>
            <td>
              <strong>{item.action}</strong>
              <br />
              <small className="muted">{item.entityId}</small>
            </td>
            <td>{item.entity}</td>
            <td>{item.actorEmail ?? item.actorPhone ?? "Система / гость"}</td>
            <td>{formatDateTime(item.createdAt)}</td>
          </tr>
        ))}
      </DataTable>
      {!items.length && <p className={styles.emptyText}>События не найдены.</p>}
    </Workspace>
  );
}

import { requirePagePermission } from "@/modules/auth/page";
import { Workspace } from "@/components/workspace";
import { NotificationPanel } from "@/components/notification-panel";
import { configuredNotificationTransport } from "@/modules/notifications/transport";
import styles from "@/components/workspace-design.module.css";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requirePagePermission("orders:manage", "/admin/notifications");
  return (
    <Workspace kind="admin">
      <header className={styles.pageHeading}>
        <h1>SMS-уведомления</h1>
      </header>
      <NotificationPanel connected={!!configuredNotificationTransport()} />
    </Workspace>
  );
}

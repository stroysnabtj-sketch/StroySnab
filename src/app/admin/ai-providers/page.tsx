import { Workspace } from "@/components/workspace";
import { AdminAiProviderForm } from "@/components/admin-ai-provider-form";
import { requirePagePermission } from "@/modules/auth/page";
import { getDocumentProviderSettings } from "@/modules/procurement/document-provider-settings";
import styles from "@/components/workspace-design.module.css";

export const dynamic = "force-dynamic";

export default async function AdminAiProvidersPage() {
  await requirePagePermission("settings:manage", "/admin/ai-providers");
  const data = await getDocumentProviderSettings();
  return (
    <Workspace kind="admin">
      <header className={styles.pageHeading}>
        <h1>Провайдер AI-КП</h1>
      </header>
      <AdminAiProviderForm initial={data} />
    </Workspace>
  );
}

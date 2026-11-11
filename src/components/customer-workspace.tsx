import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { AccountNav } from "@/components/account-nav";
import styles from "./account.module.css";

export function CustomerWorkspace({
  title,
  children,
  actions,
  identity,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  identity?: string | null;
}) {
  return (
    <>
      <SiteHeader />
      <div className={`shell ${styles.workspace}`}>
        <AccountNav identity={identity ?? undefined} />
        <main className={styles.workspaceContent} id="account-content">
          <header className={styles.heading}>
            <div>
              <span className={styles.eyebrow}>Личный кабинет</span>
              <h1>{title}</h1>
            </div>
            {actions}
          </header>
          {children}
        </main>
      </div>
    </>
  );
}

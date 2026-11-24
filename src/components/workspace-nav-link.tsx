"use client";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
export function WorkspaceNavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const active =
    pathname === href || (!["/admin", "/seller"].includes(href) && pathname.startsWith(`${href}/`));
  return (
    <Link href={href} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}


export function WorkspaceNavGroup({
  label,
  hrefs,
  openOnOverview,
  children,
}: {
  label: string;
  hrefs: string[];
  openOnOverview: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active = hrefs.some((href) => pathname === href || pathname.startsWith(href + "/"));
  return (
    <details key={pathname} className="workspace-nav-more" open={active || (openOnOverview && pathname === "/admin")}>
      <summary>
        {label}
        <ChevronDown aria-hidden="true" size={16} />
      </summary>
      <div className="workspace-nav-more-list">{children}</div>
    </details>
  );
}

import type { ReactNode } from "react";

/** Keep identical server/client markup, including reduced-motion browsers. */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-transition">{children}</div>;
}

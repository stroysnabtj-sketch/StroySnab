import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatTJS } from "@/modules/system/money";
import styles from "./account.module.css";

export type CustomerRequestRow = {
  id: string;
  href: string;
  number: string;
  title: string;
  createdAt: string;
  status: string;
  statusLabel: string;
  amount: string | null;
  amountLabel: string | null;
  group: "active" | "offered" | "closed";
};

export function CustomerRequestList({ items }: { items: CustomerRequestRow[] }) {
  return (
    <div className={styles.compactRequests}>
      {items.map((item) => (
        <Link key={item.href} href={item.href} className={styles.compactRequest}>
          <div className={styles.requestSummary}>
            <span>
              {item.number} · {new Date(item.createdAt).toLocaleDateString("ru-RU")}
            </span>
            <strong>{item.title}</strong>
          </div>
          <span className={styles.status}>{item.statusLabel}</span>
          <div className={styles.requestAmount}>
            {item.amount !== null ? (
              <>
                <strong>{formatTJS(item.amount)}</strong>
                <small>{item.amountLabel}</small>
              </>
            ) : (
              <span>—</span>
            )}
          </div>
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      ))}
      {!items.length && <p className={styles.empty}>Заявок нет</p>}
    </div>
  );
}

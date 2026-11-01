import { sql } from "drizzle-orm";
import { docCounters } from "@/db/schema";
import type { DbTransaction } from "@/db";

export const DOC_KINDS = ["ORD", "SUB", "PRQ", "DRQ", "INV"] as const;
export type DocKind = (typeof DOC_KINDS)[number];

export async function nextDocNumber(tx: DbTransaction, kind: DocKind): Promise<string> {
  const [counter] = await tx.insert(docCounters).values({ kind, value: 1 })
    .onConflictDoUpdate({ target: docCounters.kind, set: { value: sql`${docCounters.value} + 1` } })
    .returning({ value: docCounters.value });
  if (!counter) throw new Error("doc_number_failed");
  return `${kind}-${String(counter.value).padStart(4, "0")}`;
}

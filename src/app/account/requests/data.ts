import "server-only";
import type { SessionUser } from "@/modules/auth/session";
import { listProcurementRequests, PROCUREMENT_LABELS } from "@/modules/procurement/service";
import { listOwnRequests } from "@/modules/product-requests/service";
import type { CustomerRequestRow } from "@/components/customer-request-list";

const legacyLabels: Record<string, string> = {
  NEW: "Новая",
  IN_REVIEW: "В обработке",
  AVAILABLE: "Есть предложение",
  UNAVAILABLE: "Недоступно",
  CANCELLED: "Отменена",
};

// Keep both sources behind their existing ownership checks. Only row data leaves this module.
export async function customerRequestRows(user: SessionUser): Promise<CustomerRequestRow[]> {
  const [procurement, legacy] = await Promise.all([
    listProcurementRequests(user),
    listOwnRequests(user.id, { pageSize: 100 }),
  ]);
  const [procurementRest, legacyRest] = await Promise.all([
    Promise.all(
      Array.from({ length: procurement.pages - 1 }, (_, index) =>
        listProcurementRequests(user, { page: index + 2 }),
      ),
    ),
    Promise.all(
      Array.from({ length: Math.max(0, Math.ceil(legacy.total / 100) - 1) }, (_, index) =>
        listOwnRequests(user.id, { pageSize: 100, page: index + 2 }),
      ),
    ),
  ]);
  const rows: CustomerRequestRow[] = [
    ...[procurement, ...procurementRest]
      .flatMap((result) => result.items)
      .map((item): CustomerRequestRow => ({
        id: item.id,
        href: `/requests/${item.id}`,
        number: item.number,
        title: item.title,
        createdAt: new Date(item.createdAt).toISOString(),
        status: item.status,
        statusLabel: PROCUREMENT_LABELS[item.status] ?? item.status,
        amount: item.totalDirams?.toString() ?? null,
        amountLabel: item.quoteNumber,
        group: ["CANCELLED", "REJECTED", "ORDERED", "COMPLETED"].includes(item.status)
          ? "closed"
          : item.status === "QUOTED" && item.quoteNumber
            ? "offered"
            : "active",
      })),
    ...[legacy, ...legacyRest]
      .flatMap((result) => result.items)
      .map((item): CustomerRequestRow => ({
        id: item.id,
        href: `/account/requests/${item.id}`,
        number: item.number,
        title: item.productName,
        createdAt: item.createdAt,
        status: item.status,
        statusLabel: legacyLabels[item.status] ?? item.status,
        amount: item.estimatedPriceDirams,
        amountLabel:
          item.estimatedPriceDirams !== null
            ? `Ориентировочно${item.unit ? ` / ${item.unit}` : ""}`
            : null,
        group:
          item.status === "AVAILABLE"
            ? "offered"
            : ["UNAVAILABLE", "CANCELLED"].includes(item.status)
              ? "closed"
              : "active",
      })),
  ];
  return rows.sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.href.localeCompare(b.href),
  );
}

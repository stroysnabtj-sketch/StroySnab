export const statuses: Record<string, string> = {
  NEW: "Новая",
  IN_REVIEW: "В работе",
  QUOTED: "КП отправлено",
  ACCEPTED: "КП принято",
  REJECTED: "Отклонена",
  COMPLETED: "Выполнена",
  CANCELLED: "Отменена",
};
export const paymentLabels: Record<string, string> = {
  UNPAID: "Не оплачен",
  PARTIAL: "Частично оплачен",
  PAID: "Оплачен",
  REFUNDED: "Возвращено",
};
export type Line = {
  id?: string;
  imageIds?: string[];
  name: string;
  qty: string;
  unit: string;
  offerId?: string | null;
  basePriceDirams?: string;
  markupPercent?: string;
  priceDirams?: string;
  subtotalDirams?: string;
};
export type Detail = {
  request: {
    id: string;
    number: string;
    title: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string | null;
    note: string | null;
    status: string;
    lines: Line[];
    orderId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  quotation: null | {
    number: string;
    status: string;
    version: number;
    validUntil: string;
    conditions: string;
    deliveryDirams: string;
    totalDirams: string;
    markupPercent: number;
    baseDirams?: string;
    markupDirams?: string;
    lines: Line[];
  };
  attachments: { id: string; name: string; size: number; mime: string }[];
  payment: null | {
    status: string;
    paidDirams: string;
    totalDirams: string;
    balanceDirams: string;
  };
  preparation?: {
    state: string;
    updatedAt: string;
    lines?: Array<Line & { issue?: string; markupPercent?: string }>;
    warnings?: string[];
    error?: string | null;
  } | null;
  isManager: boolean;
};
export function money(value: string | undefined) {
  if (!value) return "—";
  const amount = BigInt(value);
  return `${(amount / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")},${(amount % 100n).toString().padStart(2, "0")} сомони`;
}
export function toDirams(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized))
    throw new Error("Укажите сумму в сомони, не более двух знаков после запятой");
  const [whole, fraction = ""] = normalized.split(".");
  return (BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"))).toString();
}
export function fromDirams(value: string = "0") {
  const amount = BigInt(value);
  return `${amount / 100n}.${(amount % 100n).toString().padStart(2, "0")}`;
}
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json();
  if (!response.ok)
    throw new Error(
      [
        body.error?.message ?? "Не удалось выполнить запрос",
        ...Object.values(body.error?.fields ?? {}),
      ].join(". "),
    );
  return body as T;
}

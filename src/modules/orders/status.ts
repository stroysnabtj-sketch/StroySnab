export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  NEW: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["DISPATCHED", "CANCELLED"],
  DISPATCHED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};
export const ORDER_STATUS_LABELS: Record<string, string> = {
  NEW: "Ожидает подтверждения",
  CONFIRMED: "Подтверждён",
  DISPATCHED: "В доставке",
  DELIVERED: "Получен",
  CANCELLED: "Отменён",
};

export const SHOP_ORDER_STATUS_LABELS: Record<string, string> = {
  NEW: "Новый заказ",
  ACCEPTED: "Принят магазином",
  READY: "Готов к выдаче",
  HANDED_OVER: "Передан",
};
export const SHOP_ORDER_TRANSITIONS: Record<string, string[]> = {
  NEW: ["ACCEPTED"],
  ACCEPTED: ["READY"],
  READY: ["HANDED_OVER"],
  HANDED_OVER: [],
};

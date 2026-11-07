import vehicleData from "./vehicle-options.json";
export const VEHICLE_CODES = [
  "TAXI",
  "PORTER",
  "GAZELLE",
  "MANIPULATOR",
  "DUMP_TRUCK",
  "LONG_HAUL",
] as const;
export type VehicleCode = (typeof VEHICLE_CODES)[number];
export const TIME_SLOTS = {
  MORNING: "09:00–12:00",
  AFTERNOON: "12:00–16:00",
  EVENING: "16:00–20:00",
} as const;
export type DeliveryTimeSlot = keyof typeof TIME_SLOTS;
export type VehicleOption = {
  code: VehicleCode;
  title: string;
  capacityKg: number;
  volumeM3: number;
  dimensions: string;
  photoUrl: string;
  category: string;
};
export const VEHICLE_OPTIONS = vehicleData as VehicleOption[];
export function deliveryToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dushanbe",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type)?.value)
    .join("-");
}
export function validDeliveryDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return (
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value &&
    value >= deliveryToday()
  );
}
export function deliveryDateLabel(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("ru", {
        day: "numeric",
        month: "long",
        timeZone: "Asia/Dushanbe",
      }).format(date)
    : value;
}
export function knownCartWeight(items: { qty: string; unit: string }[]): number | null {
  let total = 0;
  for (const item of items) {
    const unit = item.unit.toLocaleLowerCase("ru").replaceAll(".", "").trim();
    const factor = ["т", "тонна", "тонны", "тонн"].includes(unit)
      ? 1000
      : ["кг", "килограмм", "килограмма"].includes(unit)
        ? 1
        : ["г", "грамм"].includes(unit)
          ? 0.001
          : null;
    if (factor === null || !Number.isFinite(Number(item.qty))) return null;
    total += Number(item.qty) * factor;
  }
  return total > 0 ? Number(total.toFixed(3)) : null;
}

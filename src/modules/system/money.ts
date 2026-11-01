export function toDirams(value: string): bigint {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) throw new Error("money_invalid");
  const [whole, fraction = ""] = normalized.split(".");
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
}

export function fromDirams(value: bigint | number | string): string {
  const amount = BigInt(value);
  const negative = amount < 0n;
  const absolute = negative ? -amount : amount;
  return `${negative ? "-" : ""}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, "0")}`;
}

export function formatTJS(value: bigint | number | string): string {
  const [whole, fraction] = fromDirams(value).split(".");
  const grouped = whole.replace("-", "").replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${whole.startsWith("-") ? "−" : ""}${grouped},${fraction} TJS`;
}

export function applyPercent(value: bigint, percent: number): bigint {
  if (!Number.isInteger(percent) || percent < 0) throw new Error("percent_invalid");
  return value + (value * BigInt(percent)) / 100n;
}

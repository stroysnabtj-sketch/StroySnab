const units: Record<string, [string, number]> = {
  мм: ["length", 0.001],
  см: ["length", 0.01],
  м: ["length", 1],
  вт: ["power", 1],
  квт: ["power", 1000],
  л: ["volume", 0.001],
  "м³": ["volume", 1],
  м3: ["volume", 1],
  а: ["current", 1],
  ма: ["current", 0.001],
  г: ["mass", 0.001],
  кг: ["mass", 1],
};
export function attributeNumber(value: string, unit?: string): number | undefined {
  const match = value
    .trim()
    .replace(",", ".")
    .match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*(.*)$/);
  if (!match) return undefined;
  let number = Number(match[1]);
  const suffix = match[2].toLocaleLowerCase("ru");
  const target = unit?.toLocaleLowerCase("ru");
  if (suffix && suffix !== target) {
    const from = units[suffix],
      to = target ? units[target] : undefined;
    if (!from || !to || from[0] !== to[0]) return undefined;
    number = (number * from[1]) / to[1];
  }
  return Number.isFinite(number) && Math.abs(number) <= 1e15
    ? Number(number.toPrecision(14))
    : undefined;
}

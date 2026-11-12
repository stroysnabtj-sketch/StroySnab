// Legacy demo labels described procurement sources, not manufacturers.
// Keep them in purchasing records, but do not present them as storefront brands.
const procurementLabels = [
  "Душанбе Материал",
  "Памир Строй",
  "Сомон Строй",
  "Сомон Снаб",
  "Вахш Трейд",
  "Памир",
  "Вахш",
];
export function publicProductText(value: string): string {
  let result = value;
  for (const label of procurementLabels)
    result = result.replace(new RegExp(`(?<![\\p{L}\\p{N}])${label}(?![\\p{L}\\p{N}])`, "giu"), "");
  return result.replace(/[ \t]{2,}/g, " ").trim();
}
export function publicProductBrand(value: string | null): string | null {
  return value && !procurementLabels.some((label) => label.toLowerCase() === value.toLowerCase())
    ? value
    : null;
}

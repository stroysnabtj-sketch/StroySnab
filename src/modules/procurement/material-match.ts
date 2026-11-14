import { publicProductText } from "@/modules/catalog/public-text";
const lookalikes: Record<string, string> = {
  а: "a",
  е: "e",
  к: "k",
  м: "m",
  о: "o",
  р: "p",
  с: "c",
  т: "t",
  х: "x",
};
const normalize = (s: string) =>
  publicProductText(s)
    .toLowerCase()
    .replaceAll("ё", "е")
    .replaceAll("×", "x")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/[аекморстх]/g, (c) => lookalikes[c])
    .replace(/[^\p{L}\p{N}.]+/gu, " ")
    .trim();
const tokens = (s: string) => normalize(s).split(/\s+/).filter(Boolean);
/** A ranking score, never a calibrated probability. Numeric dimensions and grades cannot be relaxed. */
export function materialMatchScore(requested: string, candidate: string): number {
  // Handwritten cement grade Д0 is frequently transcribed as ДО; only repair this known grade context.
  const cementGrade = (value: string) =>
    /цемент/iu.test(value)
      ? value.replace(/(?<![\p{L}\p{N}])[дd][оo](?![\p{L}\p{N}])/giu, "Д0")
      : value;
  const a = normalize(cementGrade(requested)),
    b = normalize(cementGrade(candidate));
  if (a === b) return 100;
  const dimensions = (v: string) =>
    [...v.matchAll(/(\d+(?:\.\d+)?)\s*([\p{L}]+)/gu)].map((m) => `${m[1]}${m[2]}`);
  const bd = new Set(dimensions(b));
  if (dimensions(a).some((d) => !bd.has(d))) return 0;
  const shapes = (v: string) =>
    v
      .match(/\d+(?:\.\d+)?\s*[x×]\s*\d+(?:\.\d+)?(?:\s*[x×]\s*\d+(?:\.\d+)?)?/g)
      ?.map((x) => x.replace(/\s+/g, "").replaceAll("×", "x")) ?? [];
  const bsh = new Set(shapes(b));
  if (shapes(a).some((x) => !bsh.has(x))) return 0;

  const numbers = (s: string) => s.match(/\d+(?:\.\d+)?/g) ?? [];
  const bn = new Set(numbers(b));
  if (numbers(a).some((n) => !bn.has(n))) return 0;
  const at = tokens(a),
    bt = tokens(b),
    bs = new Set(bt);
  const grades = at.filter((t) => /^[\p{L}]+\d+[\p{L}]*$/u.test(t));
  if (grades.some((t) => !bs.has(t))) return 0;
  const words = at.filter((t) => /[\p{L}]/u.test(t) && t.length > 2 && !/\d/.test(t));
  // The material noun must agree; sharing a grade is not sufficient.
  if (!words.length || !bt.includes(words[0])) return 0;
  const significant = at.filter((t) => t.length > 2 || /\d/.test(t));
  const covered = significant.filter(
    (t) => bs.has(t) || (/^\d+[\p{L}]+$/u.test(t) && bn.has(numbers(t)[0] ?? "")),
  ).length;
  const recall = covered / Math.max(1, significant.length);
  return Math.min(95, Math.max(0, Math.round(recall * 100 - (bt.length > at.length ? 8 : 0))));
}
export function sameMaterialUnit(a: string, b: string): boolean {
  const canonical = (s: string) => {
    const v = s.toLowerCase().replace(/[.\s]/g, "").replaceAll("²", "2").replaceAll("³", "3");
    const groups = [
      ["т", "тонна", "тонны", "тонн"],
      ["шт", "штука", "штук", "штуки"],
      ["меш", "мешок", "мешка", "мешков"],
      ["кг", "килограмм", "килограммы"],
      ["м", "метр", "метры", "погм"],
      ["м2", "квм"],
      ["м3", "кубм"],
      ["упак", "упаковка", "упаковки"],
      ["л", "литр", "литры"],
    ];
    return groups.find((g) => g.includes(v))?.[0] ?? v;
  };
  return canonical(a) === canonical(b);
}

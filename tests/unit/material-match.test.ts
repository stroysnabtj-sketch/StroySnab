import { expect, it } from "vitest";
import { materialMatchScore, sameMaterialUnit } from "@/modules/procurement/material-match";
it("ranks exact and shorter catalogue requests without accepting conflicting dimensions", () => {
  expect(materialMatchScore("Цемент М500", "Цемент М500")).toBe(100);
  expect(materialMatchScore("Цемент М500 ДО стандарт", "Цемент М500 Д0 стандарт")).toBe(100);
  expect(materialMatchScore("Цемент М500 Д20", "Цемент М500 Д0")).toBe(0);
  expect(materialMatchScore("Цемент М500", "Цемент М500 Д0 стандарт")).toBeGreaterThanOrEqual(70);
  expect(materialMatchScore("Цемент М500", "Цемент М400 Д0")).toBe(0);
  expect(materialMatchScore("Арматура А500С 12 мм", "Арматура А500С 16 мм")).toBe(0);
  expect(materialMatchScore("Цемент М500", "Кирпич М500")).toBe(0);
  expect(materialMatchScore("Труба 10мм", "Труба 10м")).toBe(0);
  expect(materialMatchScore("Смесь 10кг", "Смесь 10г")).toBe(0);
  expect(materialMatchScore("Труба 10мм", "Труба 10см")).toBe(0);
  expect(materialMatchScore("Труба 10x20 мм", "Труба 20x10 мм")).toBe(0);
  expect(materialMatchScore("Труба 12.5 мм", "Труба 12 мм")).toBe(0);
});
it("normalizes synonymous units without converting quantities", () => {
  expect(sameMaterialUnit("т", "тонна")).toBe(true);
  expect(sameMaterialUnit("шт.", "штука")).toBe(true);
  expect(sameMaterialUnit("м²", "м2")).toBe(true);
  expect(sameMaterialUnit("мешок", "кг")).toBe(false);
});

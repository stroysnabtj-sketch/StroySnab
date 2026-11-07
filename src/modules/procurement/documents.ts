import { unzipSync } from "fflate";
import { XMLParser } from "fast-xml-parser";
import { ApiError } from "@/server/api-error";
export type ExtractedMaterial = { name: string; qty: string; unit: string };
/** Extension point for a future provider. Contacts and access tokens must never be included. */
export interface MaterialDocumentProvider {
  readonly name: string;
  extract(
    input: { bytes: Uint8Array; mime: string; filename: string },
    signal?: AbortSignal,
  ): Promise<{ lines: ExtractedMaterial[]; warnings: string[] }>;
}
export const disconnectedDocumentProvider: MaterialDocumentProvider = {
  name: "not-connected",
  async extract() {
    throw new ApiError(
      503,
      "document_provider_not_connected",
      "Автоматическое распознавание не подключено. Файл доступен менеджеру для обработки.",
    );
  },
};
export function readDocxXml(bytes: Buffer) {
  let total = 0;
  let zip: Record<string, Uint8Array>;
  try {
    zip = unzipSync(bytes, {
      filter(entry) {
        total += entry.originalSize;
        if (total > 20 * 1024 * 1024 || entry.originalSize > 8 * 1024 * 1024)
          throw new ApiError(400, "archive_size", "Слишком большой распакованный документ");
        return ["[Content_Types].xml", "word/document.xml"].includes(entry.name);
      },
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "invalid_docx", "Некорректный архив Word");
  }
  if (!zip["[Content_Types].xml"] || !zip["word/document.xml"])
    throw new ApiError(400, "invalid_docx", "Некорректный документ Word");
  const xml = new TextDecoder("utf-8", { fatal: true }).decode(zip["word/document.xml"]);
  if (/<!DOCTYPE|<!ENTITY/i.test(xml))
    throw new ApiError(400, "invalid_docx", "Объявления сущностей в документе не поддерживаются");
  return xml;
}
type XmlNode = Record<string, unknown>;
function text(node: unknown): string {
  if (Array.isArray(node)) return node.map(text).join("");
  if (!node || typeof node !== "object") return "";
  const n = node as XmlNode;
  return Object.entries(n)
    .map(([key, value]) =>
      key === "#text"
        ? String(value)
        : key === "w:tab"
          ? "\t"
          : key === "w:br"
            ? " "
            : key === ":@"
              ? ""
              : text(value),
    )
    .join("");
}
function collect(node: unknown, tag: string): unknown[] {
  if (Array.isArray(node)) return node.flatMap((n) => collect(n, tag));
  if (!node || typeof node !== "object") return [];
  return Object.entries(node as XmlNode).flatMap(([key, value]) =>
    key === tag ? [value] : key === ":@" ? [] : collect(value, tag),
  );
}
export function extractDocxLines(bytes: Buffer): ExtractedMaterial[] {
  const document = new XMLParser({
    preserveOrder: true,
    ignoreAttributes: true,
    processEntities: false,
  }).parse(readDocxXml(bytes));
  const rows = collect(document, "w:tr").map((row) =>
    collect(row, "w:tc").map((cell) => text(cell).trim()),
  );
  const explicitRows = rows.length
    ? rows
    : collect(document, "w:p").map((p) =>
        text(p)
          .split(/\t|;/)
          .map((v) => v.trim()),
      );
  const result: ExtractedMaterial[] = [];
  for (const cells of explicitRows) {
    if (cells.length < 3) continue;
    const [name, rawQty, unit] = cells,
      qty = rawQty.replace(",", ".");
    if (!name || !unit || !/^(?:0|[1-9]\d{0,6})(?:\.\d{1,3})?$/.test(qty) || Number(qty) <= 0)
      continue;
    if (name.length > 300 || unit.length > 30)
      throw new ApiError(400, "invalid_line", "Слишком длинное название или единица в Word");
    result.push({ name, qty, unit });
  }
  if (result.length > 200) throw new ApiError(400, "too_many", "Не более 200 позиций");
  if (!result.length)
    throw new ApiError(
      400,
      "manual_review",
      "Не найдены строки с названием, количеством и единицей. Приложите Word к заявке для менеджера.",
    );
  return result;
}

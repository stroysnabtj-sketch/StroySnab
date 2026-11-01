import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { XMLParser } from "fast-xml-parser";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { adminListProducts, productInput } from "./admin-service";
const headers = ["sku", "slug", "nameRu", "categorySlug", "brand", "unit", "status", "descriptionRu"] as const;
type Row = Record<string, string>;
const safe = (value: unknown) => { const text = String(value ?? ""); return /^[=+\-@]/.test(text) ? `'${text}` : text; };
const xml = (value: unknown) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
function csv(rows: Row[]) { const quote = (value: unknown) => `"${safe(value).replaceAll('"', '""')}"`; return "\uFEFF" + [headers.join(","), ...rows.map((row) => headers.map((key) => quote(row[key])).join(","))].join("\r\n"); }
function column(index: number) { let value = ""; let current = index + 1; while (current > 0) { current--; value = String.fromCharCode(65 + current % 26) + value; current = Math.floor(current / 26); } return value; }
function makeXlsx(rows: Row[]) {
  const all = [Object.fromEntries(headers.map((key) => [key, key])), ...rows];
  const sheetRows = all.map((row, rowIndex) => `<row r="${rowIndex + 1}">${headers.map((key, columnIndex) => `<c r="${column(columnIndex)}${rowIndex + 1}" t="inlineStr"><is><t xml:space="preserve">${xml(row[key])}</t></is></c>`).join("")}</row>`).join("");
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    "xl/workbook.xml": strToU8(`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Товары" sheetId="1" r:id="rId1"/></sheets></workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`),
    "xl/worksheets/sheet1.xml": strToU8(`<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`),
  };
  return Buffer.from(zipSync(files, { level: 6 }));
}
export async function exportProducts(format: string, template = false) {
  const items = await adminListProducts(); const cats = await (await getDb()).select().from(categories);
  const rows: Row[] = template ? [] : items.map((item) => ({ sku: item.sku, slug: item.slug, nameRu: item.nameRu, categorySlug: cats.find((cat) => cat.id === item.categoryId)?.slug ?? "", brand: item.brand ?? "", unit: item.unit, status: item.status, descriptionRu: item.descriptionRu ?? "" }));
  if (format === "xlsx") return { data: makeXlsx(rows), mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: "xlsx" };
  return { data: Buffer.from(csv(rows)), mime: "text/csv; charset=utf-8", extension: "csv" };
}
function parseCsv(text: string): Row[] { const matrix: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false; const source = text.replace(/^\uFEFF/, ""); for (let i = 0; i < source.length; i++) { const char = source[i]; if (char === '"') { if (quoted && source[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; } else if (char === "," && !quoted) { row.push(cell); cell = ""; } else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && source[i + 1] === "\n") i++; row.push(cell); if (row.some((value) => value.trim())) matrix.push(row); row = []; cell = ""; } else cell += char; } row.push(cell); if (row.some((value) => value.trim())) matrix.push(row); const [head = [], ...body] = matrix; return body.map((values) => Object.fromEntries(head.map((key, index) => [key.trim(), values[index] ?? ""]))); }
const array = <T>(value: T | T[] | undefined): T[] => value === undefined ? [] : Array.isArray(value) ? value : [value];
function textValue(value: unknown): string { if (value === null || value === undefined) return ""; if (typeof value === "object" && "#text" in value) return String((value as { "#text": unknown })["#text"]); return String(value); }
function parseXlsx(bytes: Buffer): Row[] {
  const files = unzipSync(new Uint8Array(bytes)); const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "", trimValues: false });
  const sheetFile = files["xl/worksheets/sheet1.xml"]; if (!sheetFile) throw new Error("worksheet_not_found");
  const shared: string[] = []; if (files["xl/sharedStrings.xml"]) { const data = parser.parse(strFromU8(files["xl/sharedStrings.xml"])); for (const item of array(data.sst?.si)) shared.push(item.t !== undefined ? textValue(item.t) : array(item.r).map((run) => textValue(run.t)).join("")); }
  const data = parser.parse(strFromU8(sheetFile)); const matrix: string[][] = [];
  for (const row of array(data.worksheet?.sheetData?.row)) { const values: string[] = []; for (const cell of array(row.c)) { const reference = String(cell.r ?? "A1"); const letters = reference.match(/[A-Z]+/)?.[0] ?? "A"; const index = letters.split("").reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1; let value = ""; if (cell.t === "inlineStr") value = textValue(cell.is?.t); else if (cell.t === "s") value = shared[Number(cell.v)] ?? ""; else value = textValue(cell.v); values[index] = value; } matrix.push(values); }
  const [head = [], ...body] = matrix; return body.map((values) => Object.fromEntries(head.map((key, index) => [String(key ?? "").trim(), values[index] ?? ""])));
}
export async function parseProductFile(file: File): Promise<Row[]> { if (file.size > 20 * 1024 * 1024) throw new Error("file_too_large"); const bytes = Buffer.from(await file.arrayBuffer()); const rows = file.name.toLowerCase().endsWith(".csv") ? parseCsv(bytes.toString("utf8")) : parseXlsx(bytes); if (rows.length > 5000) throw new Error("too_many_rows"); return rows; }
export async function validateImportRows(rows: Row[]) { const db = await getDb(); const cats = await db.select().from(categories); const existing = await db.select({ id: products.id, sku: products.sku }).from(products); return rows.map((row, index) => { const category = cats.find((cat) => cat.slug === row.categorySlug); const parsed = productInput.safeParse({ sku: row.sku, slug: row.slug, nameRu: row.nameRu, categoryId: category?.id, brand: row.brand || null, unit: row.unit, status: row.status || "DRAFT", descriptionRu: row.descriptionRu || null, attributes: [] }); return { row: index + 2, valid: parsed.success, id: existing.find((item) => item.sku === row.sku)?.id, data: parsed.success ? parsed.data : null, errors: parsed.success ? [] : parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) }; }); }

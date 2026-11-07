import { readDocxXml, extractDocxLines } from "./documents";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import sharp from "sharp";
import { unzipSync } from "fflate";
import { getDb } from "@/db";
import { procurementAttachments } from "@/db/schema";
import { getStorage } from "@/server/storage";
import { ApiError } from "@/server/api-error";
import type { SessionUser } from "@/modules/auth/session";
import { getProcurementRequest } from "./service";
import { parseProductFile } from "@/modules/catalog/import-export";
export async function validateListFile(file: File) {
  if (file.size < 1 || file.size > 10 * 1024 * 1024)
    throw new ApiError(400, "file_size", "Файл должен быть от 1 байта до 10 МБ");
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase();
  let mime = "";
  if (ext === "pdf" && bytes.subarray(0, 5).toString() === "%PDF-") mime = "application/pdf";
  if (["jpg", "jpeg", "png"].includes(ext ?? "")) {
    try {
      const m = await sharp(bytes, { limitInputPixels: 40000000 }).metadata();
      if (
        (ext === "png" && m.format === "png") ||
        (["jpg", "jpeg"].includes(ext!) && m.format === "jpeg")
      )
        mime = m.format === "png" ? "image/png" : "image/jpeg";
    } catch {}
  }
  if (ext === "csv" && !bytes.includes(0)) {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    mime = "text/csv";
  }
  if (ext === "xlsx" && bytes.subarray(0, 2).toString() === "PK") {
    let total = 0;
    const zip = unzipSync(bytes, {
      filter: (entry) => {
        total += entry.originalSize;
        if (total > 20 * 1024 * 1024 || entry.originalSize > 8 * 1024 * 1024)
          throw new ApiError(400, "archive_size", "Слишком большой распакованный файл");
        return ["[Content_Types].xml", "xl/worksheets/sheet1.xml"].includes(entry.name);
      },
    });
    if (zip["[Content_Types].xml"] && zip["xl/worksheets/sheet1.xml"])
      mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  if (ext === "docx" && bytes.subarray(0, 2).toString() === "PK") {
    readDocxXml(bytes);
    mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (!mime)
    throw new ApiError(
      400,
      "invalid_file",
      "Разрешены корректные PDF, JPEG, PNG, CSV UTF-8, XLSX и DOCX",
    );
  return { bytes, mime, ext: ext! };
}
export async function importList(file: File) {
  const valid = await validateListFile(file);
  if (valid.ext === "docx") return extractDocxLines(valid.bytes);
  if (!["csv", "xlsx"].includes(valid.ext))
    throw new ApiError(400, "manual_review", "PDF и фото приложите к заявке для менеджера");
  let input = file;
  if (valid.ext === "csv") {
    const source = valid.bytes.toString("utf8");
    const head = source.split(/\r?\n/, 1)[0];
    const delimiter = head.includes(";") ? ";" : head.includes("\t") ? "\t" : ",";
    if (delimiter !== ",") {
      let quoted = false,
        normalized = "";
      for (let i = 0; i < source.length; i++) {
        const c = source[i];
        if (c === '"') {
          if (quoted && source[i + 1] === '"') {
            normalized += '""';
            i++;
            continue;
          }
          quoted = !quoted;
        }
        normalized += c === delimiter && !quoted ? "," : c;
      }
      input = new File([normalized], "list.csv", { type: "text/csv" });
    }
  }
  const rows = await parseProductFile(input);
  if (rows.length > 200) throw new ApiError(400, "too_many", "Не более 200 позиций");
  const result = rows
    .map((row) => {
      const value = (keys: string[]) =>
        String(Object.entries(row).find(([k]) => keys.includes(k.trim().toLowerCase()))?.[1] ?? "");
      return {
        name: value(["наименование", "название", "товар", "name", "nameru", "материал"]),
        qty: value(["количество", "кол-во", "qty", "quantity"]) || "1",
        unit: value(["единица", "ед.", "ед", "ед. изм.", "unit"]) || "шт.",
      };
    })
    .filter((r) => r.name);
  if (!result.length)
    throw new ApiError(
      400,
      "empty_list",
      "Не найдены строки. Нужны колонки Наименование, Количество, Единица",
    );
  return result;
}
export async function attachList(
  id: string,
  actor: SessionUser | null,
  token: string | null,
  file: File,
) {
  await getProcurementRequest(id, actor, token);
  const valid = await validateListFile(file);
  const db = await getDb();
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM procurement_requests WHERE id=${id}::uuid FOR UPDATE`);
    const existing = await tx
      .select()
      .from(procurementAttachments)
      .where(eq(procurementAttachments.requestId, id));
    if (existing.length >= 5) throw new ApiError(400, "file_limit", "Не более пяти вложений");
    const key = `procurement/${id}/${randomUUID()}.${valid.ext}`;
    await getStorage().put(key, valid.bytes);
    const [saved] = await tx
      .insert(procurementAttachments)
      .values({
        requestId: id,
        storageKey: key,
        name: file.name.replace(/[\r\n/\\]/g, "_").slice(0, 200),
        mime: valid.mime,
        size: file.size,
      })
      .returning({ id: procurementAttachments.id, name: procurementAttachments.name });
    return saved;
  });
}
export async function readList(
  id: string,
  fileId: string,
  actor: SessionUser | null,
  token: string | null,
) {
  await getProcurementRequest(id, actor, token);
  const db = await getDb();
  const [file] = await db
    .select()
    .from(procurementAttachments)
    .where(and(eq(procurementAttachments.id, fileId), eq(procurementAttachments.requestId, id)));
  if (!file) throw new ApiError(404, "not_found", "Файл не найден");
  return { ...file, bytes: await getStorage().get(file.storageKey) };
}

import { publicProductText } from "@/modules/catalog/public-text";
import { lineBase } from "@/modules/pricing/order-markup";
import sharp from "sharp";
import { readQuotationImage } from "./images";
import PDFDocument from "pdfkit";
import path from "node:path";
import { ApiError } from "@/server/api-error";
import type { SessionUser } from "@/modules/auth/session";
import { getProcurementRequest } from "./service";
import { formatTJS } from "@/modules/system/money";

export async function quotationPdf(id: string, actor: SessionUser | null, token: string | null) {
  const data = await getProcurementRequest(id, actor, token),
    q = data.quotation;
  if (!q) throw new ApiError(404, "no_quote", "КП ещё не отправлено");
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 38, bottom: 24, left: 38, right: 38 },
    bufferPages: true,
    font: path.join(process.cwd(), "assets/fonts/CourierNew.ttf"),
    info: { Title: `КП ${q.number}`, Author: "Stroysnab.tj", CreationDate: new Date(q.validUntil) },
  });
  doc.registerFont("regular", path.join(process.cwd(), "assets/fonts/CourierNew.ttf"));
  doc.registerFont("bold", path.join(process.cwd(), "assets/fonts/CourierNew-Bold.ttf"));
  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  const left = 38,
    width = doc.page.width - 76,
    bottom = 775;
  const ink = "#242d2e",
    muted = "#687171",
    rule = "#c8ccca",
    paper = "#f8f7f4";
  let y = 0;
  const text = (
    value: string,
    x: number,
    top: number,
    w: number,
    size = 9,
    bold = false,
    align: "left" | "right" = "left",
  ) => {
    doc
      .font(bold ? "bold" : "regular")
      .fontSize(size)
      .fillColor(ink)
      .text(value, x, top, { width: w, align, lineBreak: false });
  };
  const line = (top: number) =>
    doc
      .moveTo(left, top)
      .lineTo(left + width, top)
      .lineWidth(0.5)
      .strokeColor(rule)
      .stroke();
  // Explicit cell wrapping lets unusually long names continue safely across pages.
  const wrap = (value: string, w: number, size = 9) => {
    doc.font("regular").fontSize(size);
    const result: string[] = [];
    for (const paragraph of value.split(/\r?\n/)) {
      let current = "";
      for (const character of paragraph) {
        if (current && doc.widthOfString(current + character) > w) {
          const space = current.lastIndexOf(" ");
          if (space > 0) {
            result.push(current.slice(0, space));
            current = current.slice(space + 1);
          } else {
            result.push(current);
            current = "";
          }
        }
        current += character;
      }
      result.push(current.trimEnd());
    }
    return result;
  };
  const page = (add = true) => {
    if (add) doc.addPage();
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(paper);
    text("STROYSNAB.TJ", left, 34, 260, 18, true);
    text("КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ", left, 65, width, 13, true);
    text(`№ ${q.number}${q.status === "DRAFT" ? " / ЧЕРНОВИК" : ""}`, left, 89, width, 9);
    line(110);
    y = 126;
  };
  const paragraph = (value: string, size = 9, bold = false) => {
    for (const row of wrap(value, width, size)) {
      if (y + 14 > bottom) page();
      text(row, left, y, width, size, bold);
      y += 14;
    }
  };
  page(false);
  paragraph(`Получатель: ${data.request.contactName}`);
  paragraph(`Телефон: ${data.request.contactPhone}`);
  paragraph(
    `Действительно до: ${new Date(q.validUntil).toLocaleDateString("ru-RU", { timeZone: "Asia/Dushanbe" })}`,
  );
  y += 18;
  const sizes = [25, 190, 45, 40, 109, width - 409];
  const headers = ["№", "МАТЕРИАЛ", "КОЛ-ВО", "ЕД.", "ЦЕНА / TJS", "СУММА / TJS"];
  const tableHeader = () => {
    if (y + 40 > bottom) page();
    line(y);
    let x = left;
    headers.forEach((label, i) => {
      text(label, x + 5, y + 10, sizes[i] - 10, 8, true, i > 3 ? "right" : "left");
      x += sizes[i];
    });
    y += 30;
    line(y);
  };
  tableHeader();
  for (const [index, item] of q.lines.entries()) {
    const values = [
      String(index + 1),
      publicProductText(item.name),
      item.qty,
      item.unit,
      `${lineBase(BigInt(item.priceDirams), item.qty) !== BigInt(item.subtotalDirams) ? "≈ " : ""}${formatTJS(item.priceDirams).replace(" TJS", "")}`,
      formatTJS(item.subtotalDirams).replace(" TJS", ""),
    ];
    const cells = values.map((value, i) => wrap(value, sizes[i] - 10, 8.5));
    const count = Math.max(...cells.map((cell) => cell.length));
    let offset = 0;
    while (offset < count) {
      if (y + 25 > bottom) {
        page();
        tableHeader();
      }
      const rows = Math.min(count - offset, Math.floor((bottom - y - 12) / 12));
      const height = rows * 12 + 12;
      if (index % 2 === 0) doc.rect(left, y, width, height).fill("#eeefec");
      let x = left;
      cells.forEach((cell, i) => {
        cell
          .slice(offset, offset + rows)
          .forEach((value, n) =>
            text(value, x + 5, y + 6 + n * 12, sizes[i] - 10, 8.5, false, i > 3 ? "right" : "left"),
          );
        x += sizes[i];
      });
      y += height;
      line(y);
      offset += rows;
    }
  }
  if (y + 78 > bottom) page();
  y += 20;
  const gap = 12,
    boxWidth = (width - gap) / 2;
  doc.rect(left, y, boxWidth, 44).lineWidth(0.5).strokeColor(rule).stroke();
  doc.rect(left + boxWidth + gap, y, boxWidth, 44).fill(ink);
  text("ДОСТАВКА", left + 12, y + 8, boxWidth - 24, 7);
  text(formatTJS(q.deliveryDirams), left + 12, y + 24, boxWidth - 24, 10, true);
  doc
    .font("regular")
    .fontSize(7)
    .fillColor(paper)
    .text("ИТОГО К ОПЛАТЕ", left + boxWidth + gap + 12, y + 8, { lineBreak: false });
  doc
    .font("bold")
    .fontSize(11)
    .fillColor(paper)
    .text(formatTJS(q.totalDirams), left + boxWidth + gap + 12, y + 24, {
      width: boxWidth - 24,
      lineBreak: false,
    });
  y += 60;
  if (q.conditions) {
    y += 18;
    if (y + 42 > bottom) page();
    paragraph("УСЛОВИЯ", 10, true);
    y += 6;
    paragraph(q.conditions);
  }
  const photos = q.lines.flatMap((line, index) =>
    (line.imageIds ?? []).map((imageId) => ({
      imageId,
      index,
      name: publicProductText(line.name),
    })),
  );
  if (photos.length) {
    if (y + 220 > bottom) page();
    y += 14;
    paragraph("ФОТО МАТЕРИАЛОВ", 10, true);
    y += 10;
    const photoWidth = (width - 16) / 2;
    for (let i = 0; i < photos.length; i++) {
      if (i % 2 === 0 && y + 176 > bottom) page();
      const x = left + (i % 2) * (photoWidth + 16),
        photo = photos[i];
      doc.rect(x, y, photoWidth, 128).fill("#eeefec");
      try {
        const raw = await readQuotationImage(id, photo.imageId, actor, token);
        const image = await sharp(raw.bytes).jpeg({ quality: 85 }).toBuffer();
        doc.image(image, x, y, { fit: [photoWidth, 128], align: "center", valign: "center" });
      } catch {
        text("Фото недоступно", x + 10, y + 56, photoWidth - 20, 8);
      }
      wrap(`${photo.index + 1}. ${photo.name}`, photoWidth, 8)
        .slice(0, 2)
        .forEach((row, n) => text(row, x, y + 136 + n * 11, photoWidth, 8));
      if (i % 2 === 1 || i === photos.length - 1) y += 173;
    }
  }
  // Reserved payment area: deliberately contains no payable QR payload.
  if (y + 112 > bottom) page();
  y += 14;
  const qrSize = 82;
  doc.rect(left, y, qrSize, qrSize).lineWidth(0.7).strokeColor(rule).stroke();
  for (const [dx, dy] of [
    [8, 8],
    [54, 8],
    [8, 54],
  ]) {
    doc
      .rect(left + dx, y + dy, 20, 20)
      .lineWidth(1.5)
      .strokeColor(rule)
      .stroke();
    doc.rect(left + dx + 6, y + dy + 6, 8, 8).fill(rule);
  }
  text("QR", left + 29, y + 36, 28, 13, true);
  text("ОПЛАТА ПО QR", left + 100, y + 13, width - 100, 10, true);
  text("Место для банковского QR-кода", left + 100, y + 35, width - 100, 9);
  text("Оплата пока недоступна", left + 100, y + 53, width - 100, 9);
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    line(796);
    doc
      .font("regular")
      .fontSize(7)
      .fillColor(muted)
      .text(`STROYSNAB.TJ / КП ${q.number}`, left, 807, { width: width - 90, lineBreak: false });
    doc.text(`${i + 1} / ${range.count}`, left + width - 80, 807, {
      width: 80,
      align: "right",
      lineBreak: false,
    });
  }
  doc.end();
  return { bytes: await done, number: q.number, version: q.version };
}

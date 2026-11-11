import { lineBase } from "@/modules/pricing/order-markup";
import PDFDocument from "pdfkit";
import path from "node:path";
import { ApiError } from "@/server/api-error";
import type { SessionUser } from "@/modules/auth/session";
import { getOrder, getManagedOrder, type FullOrder } from "./service";
import { getShopOrder } from "@/modules/suppliers/shop-service";
import { hasPermission } from "@/modules/rbac/permissions";
import { formatTJS } from "@/modules/system/money";

export type InvoiceOrder = Pick<
  FullOrder,
  | "orderNumber"
  | "createdAt"
  | "customerName"
  | "customerPhone"
  | "deliveryCity"
  | "deliveryAddress"
  | "vehicleType"
> & {
  items: Pick<
    FullOrder["items"][number],
    "productName" | "unit" | "qty" | "priceDirams" | "subtotalDirams"
  >[];
  totalDirams: string;
  deliveryTotalDirams: string | null;
  shopOnly?: boolean;
};

export async function loadInvoiceOrder(
  id: string,
  actor: SessionUser | null,
  token: string | null,
): Promise<InvoiceOrder> {
  if (actor && (actor.role === "SUPPLIER_OWNER" || actor.role === "SUPPLIER_STAFF")) {
    const order = await getShopOrder(actor, id);
    return {
      ...order,
      totalDirams: order.retailTotalDirams,
      deliveryTotalDirams: null,
      shopOnly: true,
    };
  }
  const order =
    actor && hasPermission(actor.role, "orders:read")
      ? await getManagedOrder(actor, id)
      : await getOrder(id, { userId: actor?.id, guestToken: token ?? undefined });
  if (!order) throw new ApiError(404, "not_found", "Заказ не найден");
  return order;
}

export async function orderPdf(id: string, actor: SessionUser | null, token: string | null) {
  return renderOrderPdf(await loadInvoiceOrder(id, actor, token));
}

export async function renderOrderPdf(order: InvoiceOrder) {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 38, bottom: 24, left: 38, right: 38 },
    bufferPages: true,
    font: path.join(process.cwd(), "assets/fonts/CourierNew.ttf"),
    info: { Title: `Накладная ${order.orderNumber}`, Author: "Stroysnab.tj" },
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
    text("НАКЛАДНАЯ", left, 65, width, 13, true);
    text(
      `№ ${order.orderNumber} от ${new Date(order.createdAt).toLocaleDateString("ru-RU", { timeZone: "Asia/Dushanbe" })}`,
      left,
      89,
      width,
      9,
    );
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
  paragraph(`Получатель: ${order.customerName}`);
  paragraph(`Телефон: ${order.customerPhone}`);
  paragraph(
    `${order.vehicleType === "PICKUP" ? "Самовывоз" : "Адрес доставки"}: ${[order.deliveryCity, order.deliveryAddress].filter(Boolean).join(", ")}`,
  );
  if (order.shopOnly) paragraph("Позиции вашего магазина", 9, true);
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
  for (const [index, item] of order.items.entries()) {
    const values = [
      String(index + 1),
      item.productName,
      item.qty,
      item.unit,
      `${lineBase(BigInt(item.priceDirams), item.qty) !== BigInt(item.subtotalDirams) ? "≈ " : ""}${formatTJS(item.priceDirams).replace(" TJS", "")}`,
      formatTJS(item.subtotalDirams).replace(" TJS", ""),
    ];
    const cells = values.map((value, i) => wrap(value, sizes[i] - 10, 8.5));
    const count = Math.max(...cells.map((cell) => cell.length));
    // Keep ordinary rows together; split only a row taller than a full page.
    const rowHeight = count * 12 + 12;
    if (y + rowHeight > bottom && rowHeight <= bottom - 156) {
      page();
      tableHeader();
    }
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
  text(
    order.deliveryTotalDirams === null
      ? "Не включена"
      : order.vehicleType === "PICKUP"
        ? "Самовывоз"
        : BigInt(order.deliveryTotalDirams) === 0n
          ? "Согласуется отдельно"
          : formatTJS(order.deliveryTotalDirams),
    left + 12,
    y + 24,
    boxWidth - 24,
    10,
    true,
  );
  doc
    .font("regular")
    .fontSize(7)
    .fillColor(paper)
    .text("ИТОГО", left + boxWidth + gap + 12, y + 8, { lineBreak: false });
  doc
    .font("bold")
    .fontSize(11)
    .fillColor(paper)
    .text(formatTJS(order.totalDirams), left + boxWidth + gap + 12, y + 24, {
      width: boxWidth - 24,
      lineBreak: false,
    });
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    line(796);
    doc
      .font("regular")
      .fontSize(7)
      .fillColor(muted)
      .text(`STROYSNAB.TJ / Накладная ${order.orderNumber}`, left, 807, {
        width: width - 90,
        lineBreak: false,
      });
    doc.text(`${i + 1} / ${range.count}`, left + width - 80, 807, {
      width: 80,
      align: "right",
      lineBreak: false,
    });
  }
  doc.end();
  return { bytes: await done, number: order.orderNumber };
}

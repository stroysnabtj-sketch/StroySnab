import { afterEach, describe, expect, it, vi } from "vitest";
import PDFDocument from "pdfkit";
import path from "node:path";
import { documentDate, documentLabels, documentUnit } from "@/modules/system/document-language";
import { renderOrderPdf, type InvoiceOrder } from "@/modules/orders/pdf";
import { quotationPdf } from "@/modules/procurement/pdf";
import { getProcurementRequest } from "@/modules/procurement/service";

vi.mock("@/modules/orders/service", () => ({ getOrder: vi.fn(), getManagedOrder: vi.fn() }));
vi.mock("@/modules/procurement/service", () => ({ getProcurementRequest: vi.fn() }));
vi.mock("@/modules/procurement/images", () => ({ readQuotationImage: vi.fn() }));

const order: InvoiceOrder = {
  orderNumber: "SNAPSHOT-2026",
  createdAt: new Date("2026-11-14T22:00:00Z"),
  customerName: "Саид / CUSTOMER SNAPSHOT",
  customerPhone: "+992931234567",
  deliveryCity: "Душанбе",
  deliveryAddress: "Суроғаи сабтшуда 17",
  vehicleType: "PICKUP",
  roundingPolicy: "HALF_UP",
  items: [
    {
      productName: "Арматура А500С",
      unit: "шт.",
      qty: "0.5",
      priceDirams: "1",
      subtotalDirams: "1",
    },
  ],
  totalDirams: "1",
  deliveryTotalDirams: "0",
};

afterEach(() => vi.restoreAllMocks());

describe("document interface language", () => {
  it("defaults to Russian and formats both date locales in Dushanbe time", () => {
    expect(documentLabels().invoiceHeading).toBe("НАКЛАДНАЯ");
    for (const locale of ["ru", "tg"] as const) {
      expect(documentDate(order.createdAt, locale)).toBe(
        new Date("2026-11-15T12:00:00Z").toLocaleDateString(locale === "tg" ? "tg-TJ" : "ru-RU", {
          timeZone: "Asia/Dushanbe",
        }),
      );
    }
  });

  it("translates only known units and preserves custom snapshot unit text", () => {
    expect(documentUnit("шт.", "tg")).toBe("дона");
    expect(documentUnit("упак.", "tg")).toBe("баста");
    expect(documentUnit("шт.")).toBe("шт.");
    expect(documentUnit("коробка 24 шт.", "tg")).toBe("коробка 24 шт.");
  });

  it("embeds all Tajik label glyphs in the existing regular and bold Courier fonts", () => {
    const doc = new PDFDocument({ font: path.join(process.cwd(), "assets/fonts/CourierNew.ttf") });
    const characters = [...new Set(Object.values(documentLabels("tg")).join(""))];
    for (const filename of ["CourierNew.ttf", "CourierNew-Bold.ttf"]) {
      doc.font(path.join(process.cwd(), "assets/fonts", filename));
      // A missing glyph is encoded as .notdef (glyph zero) by PDFKit/fontkit.
      for (const character of characters.filter((value) => !/\s/.test(value))) {
        const encoded = (
          doc as unknown as { _font: { encode(text:string): [string[],unknown]; font: { hasGlyphForCodePoint(code: number): boolean } } }
        )._font.encode(character)[0];
        expect(encoded, `${filename}: ${character}`).not.toContain("0000");
      }
    }
    doc.resume();
    doc.end();
  });

  it("renders Tajik invoice labels without changing saved names, contact details, or rounded amounts", async () => {
    const text = vi.spyOn(PDFDocument.prototype, "text");
    const pdf = await renderOrderPdf(order, "tg");
    const content = text.mock.calls.map((call) => call[0]);
    expect(pdf.bytes.subarray(0, 5).toString()).toBe("%PDF-");
    expect(content).toContain("БОРХАТ");
    expect(content).toContain("Гиранда: Саид / CUSTOMER SNAPSHOT");
    expect(content).toContain("Телефон: +992931234567");
    expect(content).toContain("Арматура А500С");
    expect(content).toContain("дона");
    expect(content).toContain("Худбурд");
    expect(content).toContain("0,01 TJS");
    expect(content).toContain("0,01");
    expect(content).not.toContain("≈ 0,01");
    expect(content).not.toContain("НАКЛАДНАЯ");
    expect(order.items[0].unit).toBe("шт.");
  });

  it("keeps Russian invoice output as the default for existing non-web callers", async () => {
    const text = vi.spyOn(PDFDocument.prototype, "text");
    await renderOrderPdf(order);
    expect(text.mock.calls.map((call) => call[0])).toEqual(
      expect.arrayContaining(["НАКЛАДНАЯ", "шт.", "ДОСТАВКА", "ИТОГО"]),
    );
  });

  it("renders Tajik quote draft, validity, totals and terms headings while retaining saved quote text", async () => {
    vi.mocked(getProcurementRequest).mockResolvedValue({
      request: { contactName: "Саид / SNAPSHOT", contactPhone: "+992931234567" },
      quotation: {
        number: "QUOTE-SNAPSHOT",
        status: "DRAFT",
        version: 7,
        validUntil: new Date("2026-11-20T00:00:00Z"),
        conditions: "Юридические условия из сохранённой версии.",
        roundingPolicy: "HALF_UP",
        deliveryDirams: "100",
        totalDirams: "101",
        lines: [
          {
            name: "Арматура А500С",
            qty: "0.5",
            unit: "упак.",
            priceDirams: "1",
            subtotalDirams: "1",
          },
        ],
      },
    } as never);
    const text = vi.spyOn(PDFDocument.prototype, "text");
    const pdf = await quotationPdf("request", null, "access", "tg");
    const content = text.mock.calls.map((call) => call[0]);
    expect(pdf.bytes.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.version).toBe(7);
    expect(getProcurementRequest).toHaveBeenLastCalledWith("request", null, "access");
    expect(content).toEqual(
      expect.arrayContaining([
        "ПЕШНИҲОДИ ТИҶОРАТӢ",
        "№ QUOTE-SNAPSHOT / ЛОИҲА",
        "ШАРТҲО",
        "Расонидан",
        "Ҷамъ барои пардохт",
        "Юридические условия из сохранённой версии.",
        "Арматура А500С",
        "баста",
        "1,01 TJS",
        "ПАРДОХТ БО QR",
      ]),
    );
    expect(content.some((value) => String(value).startsWith("Эътибор дорад то:"))).toBe(true);
    expect(content).not.toContain("≈ 0,01");
  });
});

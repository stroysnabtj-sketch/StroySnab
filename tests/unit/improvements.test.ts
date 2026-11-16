import { afterEach, describe, expect, it, vi } from "vitest";
import PDFDocument from "pdfkit";
import { renderOrderPdf, type InvoiceOrder } from "@/modules/orders/pdf";
import { generateQrMatrix } from "@/modules/system/qr";
import { mapNavigationLinks } from "@/modules/delivery/preferences";
import { profileSchema } from "@/modules/auth/schemas";

afterEach(() => vi.restoreAllMocks());

describe("invoice PDF enhancements, QR, map links, and B2B profile schema", () => {
  it("generates a valid square QR code matrix with finder patterns", () => {
    const matrix = generateQrMatrix("https://www.stroysnab.tj/orders/12345678-1234-1234-1234-123456789012");
    expect(matrix.length).toBeGreaterThanOrEqual(29);
    expect(matrix.every((row) => row.length === matrix.length)).toBe(true);
    // Top-left 7x7 finder outer border is dark
    for (let i = 0; i < 7; i++) {
      expect(matrix[0][i]).toBe(true);
      expect(matrix[6][i]).toBe(true);
      expect(matrix[i][0]).toBe(true);
      expect(matrix[i][6]).toBe(true);
    }
    // Inner 3x3 finder core is dark
    expect(matrix[3][3]).toBe(true);
  });

  it("renders SKU column, driver info, notes, payment totals, and handover signatures in PDF", async () => {
    const text = vi.spyOn(PDFDocument.prototype, "text");
    const order: InvoiceOrder = {
      id: "12345678-1234-1234-1234-123456789012",
      orderNumber: "SS-1001",
      createdAt: new Date("2026-11-16T08:00:00Z"),
      customerName: "Алишер",
      customerPhone: "+992900000001",
      deliveryCity: "Душанбе",
      deliveryAddress: "ул. Рудаки 10",
      vehicleType: "GAZELLE",
      driverName: "Рустам",
      driverPhone: "+992901112233",
      vehiclePlate: "0102AA01",
      deliveryNotes: "Въезд со двора",
      paidDirams: "1000",
      balanceDirams: "500",
      roundingPolicy: "HALF_UP",
      items: [
        {
          sku: "OD5040",
          productName: "Сапоги резиновые JCTOP",
          unit: "шт.",
          qty: "1",
          priceDirams: "1500",
          subtotalDirams: "1500",
        },
      ],
      deliveryTotalDirams: "0",
      totalDirams: "1500",
    };

    const ruPdf = await renderOrderPdf(order, "ru");
    expect(ruPdf.bytes.subarray(0, 5).toString()).toBe("%PDF-");
    const ruTexts = text.mock.calls.map((c) => String(c[0]));
    expect(ruTexts).toEqual(
      expect.arrayContaining([
        "АРТ.",
        "OD5040",
        "Водитель / Авто: Рустам / +992901112233 / 0102AA01",
        "Комментарий: Въезд со двора",
        "Оплачено: 10,00 TJS   |   Остаток к оплате: 5,00 TJS",
        "Отпустил (склад)",
        "Доставил (водитель)",
        "Принял (получатель)",
        "М.П.",
      ]),
    );
  });

  it("builds OpenStreetMap, Google Maps, and Yandex Maps links", () => {
    const links = mapNavigationLinks("38.559800", "68.787000");
    expect(links.osm).toContain("mlat=38.559800");
    expect(links.osm).toContain("mlon=68.787000");
    expect(links.google).toContain("query=38.559800,68.787000");
    expect(links.yandex).toContain("pt=68.787000,38.559800");
  });

  it("validates optional B2B fields in customer profile schema", () => {
    expect(
      profileSchema.parse({
        fullName: "Саид Каримов",
        phone: "+992900001122",
        customerType: "COMPANY",
        companyName: "ООО Сохтмон",
        taxId: "010012345",
      }),
    ).toMatchObject({
      customerType: "COMPANY",
      companyName: "ООО Сохтмон",
      taxId: "010012345",
    });
  });
});

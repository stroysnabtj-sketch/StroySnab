import { beforeEach, expect, it, vi } from "vitest";
import { getLocale } from "@/i18n/server";
import { orderPdf } from "@/modules/orders/pdf";
import { quotationPdf } from "@/modules/procurement/pdf";
import { GET as invoiceGET } from "@/app/orders/[id]/pdf/route";
import { GET as quotationGET } from "@/app/api/procurement/[id]/pdf/route";

vi.mock("@/i18n/server", () => ({ getLocale: vi.fn() }));
vi.mock("@/modules/auth/session", () => ({ optionalUser: vi.fn(async () => null) }));
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ get: () => ({ value: "guest-token" }) })) }));
vi.mock("@/modules/orders/pdf", () => ({ orderPdf: vi.fn() }));
vi.mock("@/modules/procurement/pdf", () => ({ quotationPdf: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getLocale).mockResolvedValue("tg");
  vi.mocked(orderPdf).mockResolvedValue({ bytes: Buffer.from("%PDF-test"), number: "ORDER-1" });
  vi.mocked(quotationPdf).mockResolvedValue({ bytes: Buffer.from("%PDF-test"), number: "QUOTE-1", version: 1 });
});

it("passes the resolved cookie locale and existing guest token to the invoice builder", async () => {
  const response = await invoiceGET(new Request("http://localhost/orders/id/pdf"), { params: Promise.resolve({ id: "id" }) });
  expect(response.status).toBe(200);
  expect(orderPdf).toHaveBeenLastCalledWith("id", null, "guest-token", "tg");
  expect(response.headers.get("content-disposition")).toContain(encodeURIComponent("Борхат-ORDER-1.pdf"));
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});

it("passes the resolved cookie locale and existing access token to the quote builder", async () => {
  const response = await quotationGET(new Request("http://localhost/api/procurement/id/pdf?access=access-token"), { params: Promise.resolve({ id: "id" }) });
  expect(response.status).toBe(200);
  expect(quotationPdf).toHaveBeenLastCalledWith("id", null, "access-token", "tg");
  expect(response.headers.get("content-type")).toBe("application/pdf");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});

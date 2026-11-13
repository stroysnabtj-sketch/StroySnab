import { afterEach, expect, it, vi } from "vitest";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { users, products, supplierOffers, quotationJobs, procurementRequests } from "@/db/schema";
import { submitProcurementRequest } from "@/modules/procurement/submit";
import { processQuotationJob, retryQuotationJob } from "@/modules/procurement/ai-jobs";
import { getProcurementRequest } from "@/modules/procurement/service";
import type { SessionUser } from "@/modules/auth/session";
afterEach(() => vi.unstubAllEnvs());
async function setup() {
  vi.stubEnv("AI_QUOTATION_ENABLED", "true");
  vi.stubEnv("DEEPSEEK_API_KEY", "fake-test-key");
  vi.stubEnv("STORAGE_DRIVER", "local");
  vi.stubEnv("STORAGE_DIR", ".data/quotation-ai-test-files");
  vi.stubEnv("AI_QUOTATION_DAILY_LIMIT", "100");
  const db = await getDb();
  const [buyer] = await db.select().from(users).where(eq(users.role, "CUSTOMER")).limit(1);
  const file = new File(["Наименование;Количество;Единица\nМатериал;1;шт."], "list.csv");
  const input = {
    submissionKey: crypto.randomUUID(),
    autoPrepare: true,
    contactName: "Покупатель",
    contactPhone: "+992900001122",
    lines: [],
  };
  return { db, file, input, buyer: { ...buyer, role: "CUSTOMER" } as SessionUser };
}
it("queues once, creates an authoritative draft and hides supplier costs from the customer", async () => {
  const { db, file, input, buyer } = await setup();
  const [row] = await db
    .select({ product: products, offer: supplierOffers })
    .from(products)
    .innerJoin(supplierOffers, eq(supplierOffers.productId, products.id))
    .where(
      sql`${products.status}='PUBLISHED' and ${supplierOffers.isActive}='true' and ${supplierOffers.stockQty}::numeric-${supplierOffers.reservedQty}::numeric > 2 and ${supplierOffers.minOrderQty}::numeric <= 1`,
    )
    .limit(1);
  const request = await submitProcurementRequest(input, [file], buyer);
  expect((await submitProcurementRequest(input, [file], buyer)).id).toBe(request.id);
  const extract = vi.fn(async () => ({
    lines: [{ name: row.product.sku, qty: "1", unit: row.product.unit }],
    warnings: [],
  }));
  expect(await processQuotationJob({ name: "test", extract })).toBe(true);
  expect(extract).toHaveBeenCalledOnce();
  const [job] = await db
    .select()
    .from(quotationJobs)
    .where(eq(quotationJobs.requestId, request.id));
  expect(job.state).toBe("ready");
  const view = await getProcurementRequest(request.id, buyer);
  expect(view.quotation).toBeNull();
  expect(view.preparation!.state).toBe("ready");
  expect(JSON.stringify(view.preparation)).not.toContain("basePriceDirams");
  expect(await processQuotationJob({ name: "test", extract })).toBe(false);
});
it("keeps unknown quantities unresolved and never guesses a quote price", async () => {
  const { db, file, input, buyer } = await setup();
  const request = await submitProcurementRequest(input, [file], buyer);
  await processQuotationJob({
    name: "test",
    extract: async () => ({
      lines: [{ name: "Неизвестный материал", qty: "", unit: "" }],
      warnings: [],
    }),
  });
  const [job] = await db
    .select()
    .from(quotationJobs)
    .where(eq(quotationJobs.requestId, request.id));
  expect(job.state).toBe("review");
  expect(job.lines[0].offerId).toBeUndefined();
  expect(job.lines[0].qty).toBe("");
  const [r] = await db
    .select()
    .from(procurementRequests)
    .where(eq(procurementRequests.id, request.id));
  expect(r.lines[0].qty).toBe("");
});
it("retains the submitted request when provider fails and does not automatically repeat a paid upload", async () => {
  const { db, file, input, buyer } = await setup();
  const request = await submitProcurementRequest(input, [file], buyer);
  const extract = vi.fn(async () => {
    throw new Error("provider private details");
  });
  await processQuotationJob({ name: "test", extract });
  const [job] = await db
    .select()
    .from(quotationJobs)
    .where(eq(quotationJobs.requestId, request.id));
  expect(job.state).toBe("failed");
  expect(job.error).not.toContain("private");
  await processQuotationJob({ name: "test", extract });
  expect(extract).toHaveBeenCalledOnce();
  await expect(retryQuotationJob(request.id, buyer)).rejects.toMatchObject({ status: 403 });
  const [admin] = await db.select().from(users).where(eq(users.role, "SUPER_ADMIN")).limit(1);
  await retryQuotationJob(request.id, { ...admin, role: "SUPER_ADMIN" } as SessionUser);
  await processQuotationJob({ name: "test", extract });
  expect(extract).toHaveBeenCalledTimes(2);
  await expect(
    retryQuotationJob(request.id, { ...admin, role: "SUPER_ADMIN" } as SessionUser),
  ).rejects.toMatchObject({ status: 409 });
  await expect(
    submitProcurementRequest({ ...input, submissionKey: crypto.randomUUID() }, [file], buyer),
  ).rejects.toMatchObject({ status: 429 });
});

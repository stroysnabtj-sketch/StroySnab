import { notificationOutbox } from "@/db/schema/notifications";
import { dispatchNotifications } from "@/modules/notifications/worker";
import { afterEach, expect, it, vi } from "vitest";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  users,
  products,
  supplierOffers,
  suppliers,
  quotationJobs,
  procurementRequests,
} from "@/db/schema";
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
    contactEmail: "quotation@example.test",
    lines: [],
  };
  return { db, file, input, buyer: { ...buyer, role: "CUSTOMER" } as SessionUser };
}
it("queues once, publishes an authoritative quote and hides supplier costs from the customer", async () => {
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
  expect(view.quotation?.status).toBe("SENT");
  expect(JSON.stringify(view.quotation)).not.toContain("basePriceDirams");
  expect(view.preparation!.state).toBe("ready");
  const emails = await db
    .select()
    .from(notificationOutbox)
    .where(
      sql`${notificationOutbox.entityId}=${request.id} and ${notificationOutbox.channel}='email'`,
    );
  expect(emails).toHaveLength(1);
  const send = vi.fn(async () => ({ providerMessageId: "mock-quote-email" }));
  await dispatchNotifications(db, { send }, { channel: "email", onlyIds: [emails[0].id] });
  expect(send).toHaveBeenCalledOnce();
  const message = (
    send.mock.calls[0] as unknown as [
      { body: string; attachments: Array<{ content: string; filename: string }> },
    ]
  )[0];
  expect(message.body).toContain(`/requests/${request.id}`);
  expect(Buffer.from(message.attachments[0].content, "base64").subarray(0, 5).toString()).toBe(
    "%PDF-",
  );

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

it("publishes labelled alternatives and excludes repeated demand beyond stock from the total", async () => {
  const { db, file, input } = await setup();
  const [buyer] = await db
    .insert(users)
    .values({
      email: `auto-${crypto.randomUUID()}@example.test`,
      passwordHash: "unused-test-hash",
      role: "CUSTOMER",
    })
    .returning();
  const [base] = await db.select().from(products).where(eq(products.status, "PUBLISHED")).limit(1);
  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.status, "ACTIVE"))
    .limit(1);
  const sku = `AUTO-${crypto.randomUUID()}`;
  const [product] = await db
    .insert(products)
    .values({
      sku,
      slug: sku.toLowerCase(),
      nameRu: "Материалтестовый М500 стандарт",
      categoryId: base.categoryId,
      unit: "мешок",
      status: "PUBLISHED",
    })
    .returning();
  await db
    .insert(supplierOffers)
    .values({
      productId: product.id,
      supplierId: supplier.id,
      supplierPriceDirams: 10000n,
      stockQty: "10",
      minOrderQty: "1",
    });
  const request = await submitProcurementRequest(input, [file], {
    ...buyer,
    role: "CUSTOMER",
  } as SessionUser);
  await processQuotationJob({
    name: "test",
    extract: async () => ({
      lines: [
        { name: "Материалтестовый М500", qty: "6", unit: "меш." },
        { name: "Материалтестовый М500", qty: "6", unit: "меш." },
      ],
      warnings: [],
    }),
  });
  const view = await getProcurementRequest(request.id, {
    ...buyer,
    role: "CUSTOMER",
  } as SessionUser);
  expect(view.quotation?.status).toBe("SENT");
  expect(view.quotation?.lines).toHaveLength(1);
  expect(view.quotation?.lines[0].name).toContain("Альтернатива:");
  expect(view.quotation?.conditions).toContain("Не включены в стоимость (1)");
  expect(view.quotation?.totalDirams).toBe("64200");
  expect(view.preparation?.lines?.filter((l) => l.issue)).toHaveLength(1);
});

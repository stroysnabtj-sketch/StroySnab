import { publicProductText } from "@/modules/catalog/public-text";
import { expect, it } from "vitest";
import { getDb } from "@/db";
import { users, supplierOffers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { prepareQuotationCandidates } from "@/modules/procurement/preparation";
import { createProcurementRequest } from "@/modules/procurement/service";
import { listCatalog } from "@/modules/catalog/service";
import type { SessionUser } from "@/modules/auth/session";
it("requires staff permission and returns catalog facts without publishing a quote", async () => {
  const db = await getDb(),
    [admin] = await db.select().from(users).where(eq(users.email, "admin@stroyhub.tj"));
  const actor: SessionUser = {
    id: admin.id,
    role: "ADMIN",
    email: admin.email,
    phone: admin.phone,
  };
  const product = (await listCatalog({ pageSize: 1 })).items[0];
  const lines = [
    { name: product.name, qty: "1", unit: product.unit },
    { name: "Несуществующий материал xyz987", qty: "2", unit: "шт." },
  ];
  const r = await createProcurementRequest(
    { title: "Подбор", contactName: "Тест", contactPhone: "+992931234567", lines },
    null,
  );
  await expect(
    prepareQuotationCandidates(r.id, { ...actor, role: "CUSTOMER" }, lines),
  ).rejects.toMatchObject({ status: 403 });
  const result = await prepareQuotationCandidates(r.id, actor, lines);
  expect(result.mode).toBe("LOCAL_CATALOG");
  expect(result.aiConnected).toBe(false);
  expect(
    result.lines[0].candidates.some(
      (c) => publicProductText(c.productName) === product.name && c.exact,
    ),
  ).toBe(true);
  expect(result.lines[1].candidates).toHaveLength(0);
  for (const c of result.lines[0].candidates) {
    const [o] = await db.select().from(supplierOffers).where(eq(supplierOffers.id, c.offerId));
    expect(c.basePriceDirams).toBe(o.supplierPriceDirams.toString());
  }
});

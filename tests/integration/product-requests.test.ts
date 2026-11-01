import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "@/db";
import { productRequests } from "@/db/schema";
import { createProductRequest } from "@/modules/product-requests/service";

afterAll(async () => { await closeDb(); });
describe("product request intake", () => {
  it("normalizes contacts and returns the same request for a 30-second duplicate", async () => {
    const ip = `test-${Date.now()}`;
    const input = { productName: "Тестовый материал", description: "Проверка <script>текста</script>", quantity: "2,5", unit: "т", contactName: "Гость", contactPhone: "937777777", contactEmail: null, requiredDate: null };
    const first = await createProductRequest(input, null, ip);
    const second = await createProductRequest(input, null, ip);
    expect(first.number).toMatch(/^PRQ-\d{4,}$/);
    expect(second.id).toBe(first.id);
    const db = await getDb(); const [stored] = await db.select().from(productRequests).where(eq(productRequests.id, first.id!));
    expect(stored.contactPhone).toBe("+992937777777");
    expect(stored.quantity).toBe("2.500");
    expect(stored.description).toContain("<script>");
    await db.delete(productRequests).where(eq(productRequests.id, first.id!));
  });
  it("rejects a non-positive quantity", async () => {
    await expect(createProductRequest({ productName: "Тест", quantity: "0", unit: "т", contactName: "Гость", contactPhone: "937777777" }, null, "test")).rejects.toThrow();
  });
});

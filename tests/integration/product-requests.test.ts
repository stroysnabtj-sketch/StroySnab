import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "@/db";
import { productRequests } from "@/db/schema";
import { createProductRequest } from "@/modules/product-requests/service";

afterAll(async () => {
  await closeDb();
});

describe("product request intake", () => {
  const base = {
    productName: "Тестовый материал",
    description: "Проверка <script>текста</script>",
    quantity: "2,5",
    unit: "т",
    contactName: "Гость",
    contactPhone: "937777777",
    contactEmail: null,
    requiredDate: null,
  };

  it("normalizes contacts and returns the same request for a 30-second duplicate", async () => {
    const ip = `test-${Date.now()}`;
    const first = await createProductRequest(base, null, ip);
    const second = await createProductRequest(base, null, ip);

    expect(first.number).toMatch(/^PRQ-\d{4,}$/);
    expect(second.id).toBe(first.id);

    const db = await getDb();
    const [stored] = await db
      .select()
      .from(productRequests)
      .where(eq(productRequests.id, first.id!));

    expect(stored.contactPhone).toBe("+992937777777");
    expect(stored.quantity).toBe("2.500");
    expect(stored.description).toContain("<script>");

    await db.delete(productRequests).where(eq(productRequests.id, first.id!));
  });

  it("rejects a non-positive quantity", async () => {
    await expect(
      createProductRequest(
        { productName: "Тест", quantity: "0", unit: "т", contactName: "Гость", contactPhone: "937777777" },
        null,
        "test"
      )
    ).rejects.toThrow();
  });

  it("honeypot returns fake success without saving", async () => {
    const ip = `honeypot-${Date.now()}`;
    const result = await createProductRequest(
      { ...base, website: "http://spam.example.com" },
      null,
      ip
    );

    expect(result.id).toBeNull();
    expect(result.number).toBe("PRQ-0000");
  });

  it("treats empty optional fields as null", async () => {
    const ip = `null-${Date.now()}`;
    const result = await createProductRequest(
      {
        productName: "Цемент",
        description: "",
        quantity: null,
        unit: null,
        requiredDate: null,
        contactName: "Покупатель",
        contactPhone: "901234567",
        contactEmail: "",
      },
      null,
      ip
    );

    const db = await getDb();
    const [stored] = await db
      .select()
      .from(productRequests)
      .where(eq(productRequests.id, result.id!));

    expect(stored.description).toBeNull();
    expect(stored.quantity).toBeNull();
    expect(stored.unit).toBeNull();
    expect(stored.contactEmail).toBeNull();

    await db.delete(productRequests).where(eq(productRequests.id, result.id!));
  });

  it("accepts numeric quantity from JSON input", async () => {
    const ip = `numeric-${Date.now()}`;
    const result = await createProductRequest(
      {
        productName: "Арматура",
        quantity: 10.5,
        unit: "т",
        contactName: "Покупатель",
        contactPhone: "901234567",
      },
      null,
      ip
    );

    const db = await getDb();
    const [stored] = await db
      .select()
      .from(productRequests)
      .where(eq(productRequests.id, result.id!));

    expect(stored.quantity).toBe("10.500");

    await db.delete(productRequests).where(eq(productRequests.id, result.id!));
  });

  it("creates unique numbers for different concurrent requests", async () => {
    const ip = `unique-${Date.now()}`;
    const requests = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        createProductRequest(
          {
            productName: `Товар ${i + 1}`,
            contactName: "Покупатель",
            contactPhone: `9012345${String(i).padStart(2, "0")}`,
          },
          null,
          `${ip}-${i}`
        )
      )
    );

    const numbers = new Set(requests.map((r) => r.number));
    expect(numbers.size).toBe(20);

    const db = await getDb();
    for (const r of requests) {
      await db.delete(productRequests).where(eq(productRequests.id, r.id!));
    }
  });

  it("handles 20 concurrent identical requests returning single id and record", async () => {
    const ip = `concur-${Date.now()}`;
    const input = {
      productName: "Бетон М300",
      description: "Для фундамента",
      quantity: "15",
      unit: "м³",
      contactName: "Заказчик",
      contactPhone: "900112233",
    };

    const results = await Promise.all(
      Array.from({ length: 20 }, () => createProductRequest(input, null, ip))
    );

    const firstId = results[0].id;
    expect(firstId).toBeTruthy();
    expect(results.every((r) => r.id === firstId)).toBe(true);
    expect(results.every((r) => r.number === results[0].number)).toBe(true);

    const db = await getDb();
    const rows = await db
      .select()
      .from(productRequests)
      .where(eq(productRequests.id, firstId!));
    expect(rows.length).toBe(1);

    await db.delete(productRequests).where(eq(productRequests.id, firstId!));
  });

  it("enforces database CHECK constraints on product_requests", async () => {
    const db = await getDb();

    // 1. quantity > 0
    await expect(
      db.insert(productRequests).values({
        number: `PRQ-ERR-Q-${Date.now()}`,
        productName: "Тест",
        contactName: "Тест",
        contactPhone: "+992930000001",
        quantity: "0",
      })
    ).rejects.toThrow();

    // 2. estimated_price_dirams >= 0
    await expect(
      db.insert(productRequests).values({
        number: `PRQ-ERR-P-${Date.now()}`,
        productName: "Тест",
        contactName: "Тест",
        contactPhone: "+992930000002",
        estimatedPriceDirams: -100n,
      })
    ).rejects.toThrow();

    // 3. estimated_delivery_days between 0 and 365
    await expect(
      db.insert(productRequests).values({
        number: `PRQ-ERR-D-${Date.now()}`,
        productName: "Тест",
        contactName: "Тест",
        contactPhone: "+992930000003",
        estimatedDeliveryDays: 400,
      })
    ).rejects.toThrow();

    // 4. version > 0
    await expect(
      db.insert(productRequests).values({
        number: `PRQ-ERR-V-${Date.now()}`,
        productName: "Тест",
        contactName: "Тест",
        contactPhone: "+992930000004",
        version: 0,
      })
    ).rejects.toThrow();

    // 5. invalid status
    await expect(
      db.insert(productRequests).values({
        number: `PRQ-ERR-S-${Date.now()}`,
        productName: "Тест",
        contactName: "Тест",
        contactPhone: "+992930000005",
        status: "INVALID_STATUS",
      })
    ).rejects.toThrow();
  });

  it("makes different requests by different IPs not deduplicate", async () => {
    const input = { ...base, quantity: null, unit: null };

    // Same product data but different IPs for guest → different fingerprints (owner = ip:...)
    const result1 = await createProductRequest(input, null, `dedup-a-${Date.now()}`);
    const result2 = await createProductRequest(input, null, `dedup-b-${Date.now()}`);

    expect(result1.id).not.toBe(result2.id);

    const db = await getDb();
    await db.delete(productRequests).where(eq(productRequests.id, result1.id!));
    await db.delete(productRequests).where(eq(productRequests.id, result2.id!));
  });
});

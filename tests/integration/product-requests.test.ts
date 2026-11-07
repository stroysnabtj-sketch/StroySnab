import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "@/db";
import { productRequests, users } from "@/db/schema";
import { createProductRequest } from "@/modules/product-requests/service";
import type { SessionUser } from "@/modules/auth/session";

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

describe("product request management and customer isolation", () => {
  let adminActor: SessionUser;
  let salesActor: SessionUser;
  let customerActor: SessionUser;
  let otherCustomerActor: SessionUser;

  beforeAll(async () => {
    const db = await getDb();
    const [admin] = await db.select().from(users).where(eq(users.email, "admin@stroyhub.tj"));
    adminActor = { id: admin.id, role: "SUPER_ADMIN", phone: admin.phone, email: admin.email };

    const [sales] = await db.select().from(users).where(eq(users.email, "sales@stroyhub.tj"));
    salesActor = { id: sales.id, role: "SALES_MANAGER", phone: sales.phone, email: sales.email };

    const [customer] = await db.select().from(users).where(eq(users.email, "client@example.com"));
    customerActor = { id: customer.id, role: "CUSTOMER", phone: customer.phone, email: customer.email };

    const otherPhone = "+992938889900";
    let [other] = await db.select().from(users).where(eq(users.phone, otherPhone));
    if (!other) {
      [other] = await db
        .insert(users)
        .values({
          phone: otherPhone,
          email: "other@example.com",
          passwordHash: "hash",
          role: "CUSTOMER",
        })
        .returning();
    }
    otherCustomerActor = { id: other.id, role: "CUSTOMER", phone: other.phone, email: other.email };
  });

  it("checks permissions: only authorized managers can access listManagedRequests", async () => {
    const { listManagedRequests } = await import("@/modules/product-requests/service");

    // Managers should succeed
    const adminRes = await listManagedRequests(adminActor, { pageSize: 5 });
    expect(adminRes.items).toBeDefined();

    const salesRes = await listManagedRequests(salesActor, { pageSize: 5 });
    expect(salesRes.items).toBeDefined();

    // Customer or other roles should get 403
    await expect(listManagedRequests(customerActor, {})).rejects.toThrow("Недостаточно прав");
  });

  it("handles optimistic concurrency: second PATCH on same version returns 409", async () => {
    const { createProductRequest, respondProductRequest } = await import("@/modules/product-requests/service");

    const created = await createProductRequest(
      {
        productName: "Песок речной",
        quantity: "10",
        unit: "т",
        contactName: "Клиент",
        contactPhone: "900998877",
      },
      null,
      `concur-mgmt-${Date.now()}`
    );

    expect(created.id).toBeTruthy();

    // Manager 1 responds with version 1
    const updated1 = await respondProductRequest(
      salesActor,
      created.id!,
      {
        status: "IN_REVIEW",
        responseNote: "Уточняем наличие карьера",
        version: 1,
      },
      "127.0.0.1"
    );

    expect(updated1.version).toBe(2);
    expect(updated1.assignedTo).toBe(salesActor.id);

    // Manager 2 attempts concurrent response using stale version 1 -> 409 conflict
    await expect(
      respondProductRequest(
        adminActor,
        created.id!,
        {
          status: "AVAILABLE",
          responseNote: "В наличии",
          version: 1,
        },
        "127.0.0.1"
      )
    ).rejects.toThrow("Заявка была изменена другим сотрудником");

    const db = await getDb();
    await db.delete(productRequests).where(eq(productRequests.id, created.id!));
  });

  it("enforces state transitions and comment requirement for AVAILABLE/UNAVAILABLE", async () => {
    const { createProductRequest, respondProductRequest } = await import("@/modules/product-requests/service");

    const created = await createProductRequest(
      {
        productName: "Кирпич красный",
        quantity: "1000",
        unit: "шт.",
        contactName: "Клиент",
        contactPhone: "900998877",
      },
      null,
      `trans-${Date.now()}`
    );

    // Manager cannot set status back to NEW
    await expect(
      respondProductRequest(
        salesActor,
        created.id!,
        {
          status: "NEW",
          version: 1,
        },
        "127.0.0.1"
      )
    ).rejects.toThrow();

    // AVAILABLE requires a responseNote
    await expect(
      respondProductRequest(
        salesActor,
        created.id!,
        {
          status: "AVAILABLE",
          responseNote: "",
          version: 1,
        },
        "127.0.0.1"
      )
    ).rejects.toThrow();

    // Valid AVAILABLE response with note and price in dirams
    const validResponse = await respondProductRequest(
      salesActor,
      created.id!,
      {
        status: "AVAILABLE",
        responseNote: "Есть на складе в Душанбе",
        estimatedPriceDirams: "850000",
        estimatedDeliveryDays: 3,
        version: 1,
      },
      "127.0.0.1"
    );

    expect(validResponse.status).toBe("AVAILABLE");
    expect(validResponse.estimatedPriceDirams).toBe("850000");
    expect(validResponse.estimatedDeliveryDays).toBe(3);

    // Can re-open back to IN_REVIEW
    const reopened = await respondProductRequest(
      adminActor,
      created.id!,
      {
        status: "IN_REVIEW",
        responseNote: "Потребовался перерасчёт логистики",
        version: validResponse.version,
      },
      "127.0.0.1"
    );
    expect(reopened.status).toBe("IN_REVIEW");

    const db = await getDb();
    await db.delete(productRequests).where(eq(productRequests.id, created.id!));
  });

  it("isolates customer requests and prevents viewing/canceling other users requests", async () => {
    const { listOwnRequests, getOwnRequest, cancelOwnRequest } = await import("@/modules/product-requests/service");

    const db = await getDb();
    // Insert actual test users in DB to satisfy foreign keys if needed
    const req = await db
      .insert(productRequests)
      .values({
        number: `PRQ-CUST-${Date.now()}`,
        userId: customerActor.id,
        productName: "Плитка тротуарная",
        quantity: "50",
        unit: "м²",
        contactName: "Покупатель 1",
        contactPhone: customerActor.phone,
      })
      .returning();

    const requestId = req[0].id;

    // Customer A can view own request
    const ownReq = await getOwnRequest(customerActor.id, requestId);
    expect(ownReq.id).toBe(requestId);
    expect(ownReq.productName).toBe("Плитка тротуарная");

    // Customer A list includes it
    const ownList = await listOwnRequests(customerActor.id, {});
    expect(ownList.items.some((item) => item.id === requestId)).toBe(true);

    // Customer B cannot view Customer A request (404)
    await expect(getOwnRequest(otherCustomerActor.id, requestId)).rejects.toThrow("Заявка не найдена");

    // Customer B list does NOT include Customer A request
    const otherList = await listOwnRequests(otherCustomerActor.id, {});
    expect(otherList.items.some((item) => item.id === requestId)).toBe(false);

    // Customer A can cancel own request
    const cancelled = await cancelOwnRequest(
      customerActor.id,
      requestId,
      { version: req[0].version, reason: "Нашёл в другом месте" },
      "127.0.0.1"
    );
    expect(cancelled.status).toBe("CANCELLED");

    // Manager cannot edit cancelled request
    const { respondProductRequest } = await import("@/modules/product-requests/service");
    await expect(
      respondProductRequest(
        salesActor,
        requestId,
        {
          status: "AVAILABLE",
          responseNote: "Всё же нашли",
          version: cancelled.version,
        },
        "127.0.0.1"
      )
    ).rejects.toThrow("Заявка была отменена покупателем");

    await db.delete(productRequests).where(eq(productRequests.id, requestId));
  });
});

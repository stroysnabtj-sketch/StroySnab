import { describe, expect, it } from "vitest";
import { makeProductRequestSchema, getDushanbeDateStrings } from "@/modules/product-requests/schemas";

describe("productRequestSchema", () => {
  const base = {
    productName: "Арматура А500С",
    contactName: "Гость",
    contactPhone: "937777777",
    contactEmail: null,
    requiredDate: null,
    quantity: null,
    unit: null,
  };

  const schema = makeProductRequestSchema(new Date());

  describe("productName", () => {
    it("rejects names shorter than 2 characters", () => {
      const result = schema.safeParse({ ...base, productName: "A" });
      expect(result.success).toBe(false);
    });

    it("rejects names longer than 200 characters", () => {
      const result = schema.safeParse({ ...base, productName: "A".repeat(201) });
      expect(result.success).toBe(false);
    });

    it("trims whitespace", () => {
      const result = schema.safeParse({ ...base, productName: "  Цемент  " });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.productName).toBe("Цемент");
    });
  });

  describe("quantity", () => {
    it("accepts valid decimal quantity with comma", () => {
      const result = schema.safeParse({ ...base, quantity: "2,5", unit: "т" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.quantity).toBe("2.5");
    });

    it("accepts valid decimal quantity with dot", () => {
      const result = schema.safeParse({ ...base, quantity: "0.001", unit: "кг" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.quantity).toBe("0.001");
    });

    it("accepts numeric input (number type from JSON)", () => {
      const result = schema.safeParse({ ...base, quantity: 10.5, unit: "м" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.quantity).toBe("10.5");
    });

    it("accepts large valid quantity", () => {
      const result = schema.safeParse({ ...base, quantity: "99999999999.999", unit: "кг" });
      expect(result.success).toBe(true);
    });

    it("rejects zero quantity", () => {
      const result = schema.safeParse({ ...base, quantity: "0", unit: "т" });
      expect(result.success).toBe(false);
    });

    it("rejects negative quantity", () => {
      const result = schema.safeParse({ ...base, quantity: "-5", unit: "т" });
      expect(result.success).toBe(false);
    });

    it("rejects quantity with more than 3 decimal places", () => {
      const result = schema.safeParse({ ...base, quantity: "1.1234", unit: "т" });
      expect(result.success).toBe(false);
    });

    it("rejects quantity exceeding 14 digits", () => {
      const result = schema.safeParse({ ...base, quantity: "123456789012345", unit: "т" });
      expect(result.success).toBe(false);
    });

    it("transforms null/empty to null", () => {
      const result = schema.safeParse({ ...base, quantity: "", unit: null });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.quantity).toBeNull();
    });

    it("accepts undefined quantity", () => {
      const result = schema.safeParse({ ...base });
      expect(result.success).toBe(true);
    });
  });

  describe("unit required when quantity present", () => {
    it("requires unit when quantity is provided", () => {
      const result = schema.safeParse({ ...base, quantity: "10", unit: null });
      expect(result.success).toBe(false);
      if (!result.success) {
        const unitIssue = result.error.issues.find((i) => i.path.includes("unit"));
        expect(unitIssue?.message).toBe("unit_required");
      }
    });

    it("does not require unit when quantity is absent", () => {
      const result = schema.safeParse({ ...base, quantity: null, unit: null });
      expect(result.success).toBe(true);
    });
  });

  describe("description", () => {
    it("allows up to 2000 characters", () => {
      const result = schema.safeParse({ ...base, description: "A".repeat(2000) });
      expect(result.success).toBe(true);
    });

    it("rejects over 2000 characters", () => {
      const result = schema.safeParse({ ...base, description: "A".repeat(2001) });
      expect(result.success).toBe(false);
    });

    it("transforms empty string to null", () => {
      const result = schema.safeParse({ ...base, description: "" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.description).toBeNull();
    });

    it("transforms whitespace-only to null", () => {
      const result = schema.safeParse({ ...base, description: "   " });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.description).toBeNull();
    });
  });

  describe("contactEmail", () => {
    it("trims and lowercases valid email", () => {
      const result = schema.safeParse({ ...base, contactEmail: " Test@Example.com " });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.contactEmail).toBe("test@example.com");
    });

    it("allows empty email", () => {
      const result = schema.safeParse({ ...base, contactEmail: "" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.contactEmail).toBeNull();
    });
  });

  describe("unit field", () => {
    it("accepts custom unit up to 20 characters", () => {
      const result = schema.safeParse({ ...base, quantity: "5", unit: "палет" });
      expect(result.success).toBe(true);
    });

    it("rejects unit longer than 20 characters", () => {
      const result = schema.safeParse({ ...base, quantity: "1", unit: "A".repeat(21) });
      expect(result.success).toBe(false);
    });
  });

  describe("honeypot (website)", () => {
    it("passes validation when website is empty", () => {
      const result = schema.safeParse({ ...base, website: "" });
      expect(result.success).toBe(true);
    });

    it("passes validation with filled honeypot (service handles it)", () => {
      const result = schema.safeParse({ ...base, website: "http://spam.com" });
      expect(result.success).toBe(true);
    });
  });
});

describe("getDushanbeDateStrings", () => {
  it("computes today and maxDate correctly", () => {
    const { today, maxDate } = getDushanbeDateStrings(new Date("2026-11-01T12:00:00+05:00"));
    expect(today).toBe("2026-11-01");
    expect(maxDate).toBe("2028-11-01");
  });

  it("handles Feb 29 leap year -> non-leap year", () => {
    // 2028 is a leap year, today = Feb 29 → 2030 is not leap, max = Feb 28
    const { today, maxDate } = getDushanbeDateStrings(new Date("2028-02-29T12:00:00+05:00"));
    expect(today).toBe("2028-02-29");
    expect(maxDate).toBe("2030-02-28");
  });

  it("handles Feb 29 leap year -> leap year", () => {
    // 2024 is a leap year, today = Feb 29 → 2026 is not leap, max = Feb 28
    const { today, maxDate } = getDushanbeDateStrings(new Date("2024-02-29T12:00:00+05:00"));
    expect(today).toBe("2024-02-29");
    expect(maxDate).toBe("2026-02-28");
  });
});

describe("requiredDate validation", () => {
  const base = { productName: "Тест", contactName: "Гость", contactPhone: "937777777" };

  it("rejects past dates", () => {
    const schema = makeProductRequestSchema(new Date("2026-11-01T12:00:00+05:00"));
    const result = schema.safeParse({ ...base, requiredDate: "2026-10-31" });
    expect(result.success).toBe(false);
  });

  it("accepts today", () => {
    const schema = makeProductRequestSchema(new Date("2026-11-01T12:00:00+05:00"));
    const result = schema.safeParse({ ...base, requiredDate: "2026-11-01" });
    expect(result.success).toBe(true);
  });

  it("rejects date more than 2 years in future", () => {
    const schema = makeProductRequestSchema(new Date("2026-11-01T12:00:00+05:00"));
    const result = schema.safeParse({ ...base, requiredDate: "2028-11-02" });
    expect(result.success).toBe(false);
  });

  it("accepts null requiredDate", () => {
    const schema = makeProductRequestSchema(new Date("2026-11-01T12:00:00+05:00"));
    const result = schema.safeParse({ ...base, requiredDate: null });
    expect(result.success).toBe(true);
  });

  it("accepts empty string requiredDate (transforms to null)", () => {
    const schema = makeProductRequestSchema(new Date("2026-11-01T12:00:00+05:00"));
    const result = schema.safeParse({ ...base, requiredDate: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.requiredDate).toBeNull();
  });

  it("day changes after midnight in Asia/Dushanbe", () => {
    // 2026-11-01 23:59 UTC = 2026-11-02 04:59 TJT
    const schema = makeProductRequestSchema(new Date("2026-11-01T23:59:00Z"));
    const result = schema.safeParse({ ...base, requiredDate: "2026-11-02" });
    expect(result.success).toBe(true);
    // 2026-11-01 is now yesterday in TJT
    const result2 = schema.safeParse({ ...base, requiredDate: "2026-11-01" });
    expect(result2.success).toBe(false);
  });
});

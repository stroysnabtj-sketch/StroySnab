import { describe, expect, it } from "vitest";
import { registerSchema } from "@/modules/auth/schemas";
import { hasPermission } from "@/modules/rbac/permissions";

describe("registration terms", () => {
  const base = { fullName: "Test User", phone: "921234567", email: "", password: "password123" };
  it("requires literal true", () => {
    expect(registerSchema.safeParse({ ...base, termsAccepted: true }).success).toBe(true);
    expect(registerSchema.safeParse({ ...base, termsAccepted: false }).success).toBe(false);
    expect(registerSchema.safeParse(base).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, termsAccepted: "true" }).success).toBe(false);
  });
});

describe("role matrix", () => {
  it("allows only administrators to manage users", () => {
    expect(hasPermission("ADMIN", "users:manage")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "admins:manage")).toBe(true);
    expect(hasPermission("ADMIN", "admins:manage")).toBe(false);
    expect(hasPermission("CUSTOMER", "users:manage")).toBe(false);
  });
  it("keeps supplier permissions isolated", () => {
    expect(hasPermission("SUPPLIER_OWNER", "seller:team")).toBe(true);
    expect(hasPermission("SUPPLIER_STAFF", "seller:team")).toBe(false);
    expect(hasPermission("SUPPLIER_OWNER", "pricing:manage")).toBe(false);
  });
});

import { describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users, sessions } from "@/db/schema";
import { login } from "@/modules/auth/service";
import { getCurrentUser, hashToken } from "@/modules/auth/session";
import { requestContactCode } from "@/modules/auth/contact-code";
import { searchAdminProducts } from "@/modules/catalog/admin-service";
import { customerOrderView } from "@/modules/orders/customer-view";
import type { FullOrder } from "@/modules/orders/service";
import { safeAuthDestination } from "@/modules/auth/destination";

const cookie = vi.hoisted(() => ({ token: "" }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: cookie.token }) }),
}));

describe("single StroySnab storefront", () => {
  it("rejects password login and paid code delivery for retired supplier accounts", async () => {
    await expect(
      login({ identifier: "seller@stroyhub.tj", password: "Seller123!" }, "test", "test"),
    ).rejects.toMatchObject({ code: "invalid_credentials" });
    const deliver = vi.fn();
    await expect(
      requestContactCode(
        { purpose: "login", channel: "email", identifier: "seller2@stroyhub.tj" },
        "test",
        deliver,
      ),
    ).rejects.toMatchObject({ code: "account_unavailable" });
    expect(deliver).not.toHaveBeenCalled();
  });
  it("invalidates an already issued supplier session", async () => {
    const db = await getDb();
    const [supplier] = await db.select().from(users).where(eq(users.email, "seller3@stroyhub.tj"));
    cookie.token = "retired-supplier-session-token";
    const tokenHash = hashToken(cookie.token);
    await db
      .insert(sessions)
      .values({ userId: supplier.id, tokenHash, expiresAt: new Date(Date.now() + 86400000) });
    expect(await getCurrentUser()).toBeNull();
    expect(await db.select().from(sessions).where(eq(sessions.tokenHash, tokenHash))).toHaveLength(
      0,
    );
    cookie.token = "";
  });
  it("keeps supplier names available in our admin catalog", async () => {
    const result = await searchAdminProducts({ q: "Цемент" });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.some((item) => item.supplierNames.length > 0)).toBe(true);
  });
  it("does not expose supplier identities or costs in the customer order", () => {
    const view = customerOrderView({
      items: [
        {
          id: "line",
          productName: "Цемент",
          supplierName: "Private supplier",
          supplierId: "private",
          supplierPriceDirams: "100",
        },
      ],
      history: [],
    } as unknown as FullOrder);
    expect(view.items[0]).not.toHaveProperty("supplierName");
    expect(view.items[0]).not.toHaveProperty("supplierId");
    expect(view.items[0]).not.toHaveProperty("supplierPriceDirams");
  });
  it("does not navigate to retired shop pages after authentication", () => {
    expect(safeAuthDestination("/seller/orders")).toBe("/account");
    expect(safeAuthDestination("/supplier-invite?code=test")).toBe("/account");
    expect(safeAuthDestination("/admin/orders")).toBe("/admin/orders");
  });
});

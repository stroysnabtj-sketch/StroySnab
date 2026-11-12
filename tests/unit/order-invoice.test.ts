import { describe, expect, it, vi } from "vitest";
import { getOrder, getManagedOrder } from "@/modules/orders/service";
import { loadInvoiceOrder } from "@/modules/orders/pdf";
vi.mock("@/modules/orders/service", () => ({ getOrder: vi.fn(), getManagedOrder: vi.fn() }));
const actor = (role: "CUSTOMER" | "ADMIN" | "SUPPLIER_OWNER") => ({
  id: "actor",
  phone: "+992900000000",
  email: null,
  role,
});
describe("invoice authorization and snapshot", () => {
  it("rejects missing or wrong guest access", async () => {
    vi.mocked(getOrder).mockResolvedValue(null);
    await expect(loadInvoiceOrder("order", null, null)).rejects.toMatchObject({ status: 404 });
    await expect(loadInvoiceOrder("order", null, "wrong")).rejects.toMatchObject({ status: 404 });
  });
  it("uses customer ownership and staff permissions", async () => {
    vi.mocked(getOrder).mockResolvedValue({ orderNumber: "SNAPSHOT" } as never);
    expect((await loadInvoiceOrder("order", actor("CUSTOMER"), "token")).orderNumber).toBe(
      "SNAPSHOT",
    );
    expect(getOrder).toHaveBeenLastCalledWith("order", { userId: "actor", guestToken: "token" });
    vi.mocked(getManagedOrder).mockResolvedValue({ orderNumber: "STAFF" } as never);
    expect((await loadInvoiceOrder("order", actor("ADMIN"), null)).orderNumber).toBe("STAFF");
  });
  it("rejects retired shop accounts", async () => {
    await expect(loadInvoiceOrder("order", actor("SUPPLIER_OWNER"), null)).rejects.toMatchObject({
      status: 403,
    });
  });
});

import { expect, it } from "vitest";
import { orderInputSchema } from "@/modules/orders/service";
it("accepts cash and rejects unconfigured invoice payment for new orders", () => {
  const input = {
    idempotencyKey: crypto.randomUUID(),
    customerName: "Покупатель",
    customerPhone: "+992900000000",
    deliveryCity: "Душанбе",
    deliveryAddress: "",
    fulfillment: "PICKUP",
  };
  expect(orderInputSchema.safeParse({ ...input, paymentMethod: "CASH_ON_DELIVERY" }).success).toBe(
    true,
  );
  expect(orderInputSchema.safeParse({ ...input, paymentMethod: "BANK_INVOICE" }).success).toBe(
    false,
  );
});

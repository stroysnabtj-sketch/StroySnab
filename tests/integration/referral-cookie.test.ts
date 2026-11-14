import { afterAll, expect, it, vi } from "vitest";
import { randomInt } from "node:crypto";
const delivery = vi.hoisted(() => ({ code: "", cookie: "" }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "stroysnab_ref" ? { value: delivery.cookie } : undefined),
  }),
}));
vi.mock("@/modules/auth/turnstile", () => ({ verifyContactCaptcha: vi.fn(async () => {}) }));
vi.mock("@/modules/auth/code-delivery", () => ({
  sendContactCode: async (input: { code: string }) => {
    delivery.code = input.code;
  },
}));
import { closeDb } from "@/db";
import { registerCustomer } from "@/modules/auth/service";
import { getReferralSummary } from "@/modules/referrals/service";
import { verifyContactCode } from "@/modules/auth/contact-code";
import { POST } from "@/app/api/auth/code/request/route";
afterAll(closeDb);
it("uses the private referral cookie when the OTP registration has no ref query parameter", async () => {
  const owner = await registerCustomer(
    {
      fullName: "Пригласивший",
      phone: `+992${randomInt(100000000, 999999999)}`,
      password: "Password123!",
      termsAccepted: true,
    },
    "test",
  );
  delivery.cookie = (await getReferralSummary(owner.id)).code;
  const response = await POST(
    new Request("http://localhost:3000/api/auth/code/request", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost:3000" },
      body: JSON.stringify({
        purpose: "register",
        channel: "email",
        identifier: `cookie-${crypto.randomUUID()}@example.test`,
        fullName: "Друг из каталога",
        termsAccepted: true,
      }),
    }),
  );
  expect(response.status).toBe(200);
  const { challengeId } = await response.json();
  await verifyContactCode(
    {
      challengeId,
      code: delivery.code,
      password: "Password123!",
      passwordConfirmation: "Password123!",
    },
    "test",
    "test",
  );
  expect((await getReferralSummary(owner.id)).stats).toEqual({
    invited: 1,
    pending: 1,
    credited: 0,
  });
});

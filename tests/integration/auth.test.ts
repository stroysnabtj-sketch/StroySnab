import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "@/db";
import { users } from "@/db/schema";
import { login, registerCustomer } from "@/modules/auth/service";

const phone = "+992939999999";
afterAll(async () => { const db = await getDb(); await db.delete(users).where(eq(users.phone, phone)); await closeDb(); });

describe("auth persistence", () => {
  it("registers, reads and logs in without plaintext password", async () => {
    const created = await registerCustomer({ fullName: "Integration User", phone: "939999999", email: "integration@example.com", password: "Integration123!", termsAccepted: true }, "test");
    const db = await getDb();
    const [stored] = await db.select().from(users).where(eq(users.id, created.id));
    expect(stored.termsVersion).toBe("2026-10-30");
    expect(stored.termsAcceptedAt).toBeTruthy();
    expect(stored.passwordHash).not.toContain("Integration123!");
    const credentials = { identifier: "integration@example.com", password: "Integration123!" };
    await expect(login(credentials, "test", "vitest", true)).rejects.toMatchObject({ code: "invalid_credentials" });
    const session = await login(credentials, "test", "vitest");
    expect(session.token.length).toBeGreaterThan(30);
    await db.update(users).set({ role: "SUPER_ADMIN" }).where(eq(users.id, created.id));
    await expect(login(credentials, "test", "vitest", true)).resolves.toMatchObject({ role: "SUPER_ADMIN" });
  }, 20000);
});

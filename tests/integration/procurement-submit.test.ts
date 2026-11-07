import { describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { procurementRequests, procurementAttachments, users } from "@/db/schema";
import { submitProcurementRequest } from "@/modules/procurement/submit";
const storage = vi.hoisted(() => ({ objects: new Map<string, Buffer>(), failOn: 0, puts: 0 }));
vi.mock("@/server/storage", () => ({
  getStorage: () => ({
    put: async (key: string, data: Buffer) => {
      storage.puts++;
      if (storage.failOn === storage.puts) throw new Error("upload_failed");
      storage.objects.set(key, data);
    },
    delete: async (key: string) => {
      storage.objects.delete(key);
    },
    get: async (key: string) => storage.objects.get(key),
  }),
}));
const payload = () => ({
  submissionKey: crypto.randomUUID(),
  accessToken: crypto.randomUUID(),
  contactName: "Покупатель",
  contactPhone: "900001122",
  lines: [],
});
const file = (name = "list.pdf") => new File(["%PDF-1.4 test"], name, { type: "application/pdf" });
describe("atomic procurement submission", () => {
  it("creates attachment-only request without a fake line and retries once", async () => {
    const input = payload();
    const a = await submitProcurementRequest(input, [file()], null);
    const b = await submitProcurementRequest(input, [file()], null);
    expect(b).toEqual(a);
    const db = await getDb();
    const [row] = await db
      .select()
      .from(procurementRequests)
      .where(eq(procurementRequests.id, a.id));
    expect(row.lines).toEqual([]);
    expect(row.guestTokenHash).not.toBe(input.accessToken);
    expect(row.guestTokenHash).toHaveLength(64);
    expect(
      await db
        .select()
        .from(procurementAttachments)
        .where(eq(procurementAttachments.requestId, a.id)),
    ).toHaveLength(1);
    await expect(
      submitProcurementRequest({ ...input, contactName: "Другой" }, [file()], null),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      submitProcurementRequest({ ...input, accessToken: crypto.randomUUID() }, [file()], null),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("rejects empty or invalid files before storing a request", async () => {
    const input = payload();
    await expect(submitProcurementRequest(input, [], null)).rejects.toThrow();
    await expect(
      submitProcurementRequest(input, [new File(["bad"], "bad.pdf")], null),
    ).rejects.toThrow();
    expect(
      await (
        await getDb()
      )
        .select()
        .from(procurementRequests)
        .where(eq(procurementRequests.submissionKey, input.submissionKey)),
    ).toHaveLength(0);
  });
  it("rolls back metadata and deletes stored objects on upload failure", async () => {
    const input = payload(),
      before = storage.objects.size;
    storage.failOn = storage.puts + 2;
    await expect(
      submitProcurementRequest(input, [file(), file("second.pdf")], null),
    ).rejects.toThrow("upload_failed");
    storage.failOn = 0;
    expect(storage.objects.size).toBe(before);
    expect(
      await (
        await getDb()
      )
        .select()
        .from(procurementRequests)
        .where(eq(procurementRequests.submissionKey, input.submissionKey)),
    ).toHaveLength(0);
    expect(
      (await submitProcurementRequest(input, [file(), file("second.pdf")], null)).id,
    ).toBeTruthy();
  });
  it("binds authenticated submission to its customer", async () => {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.role, "CUSTOMER")).limit(1);
    const actor = { id: user.id, email: user.email, phone: user.phone, role: "CUSTOMER" as const };
    const input = { ...payload(), lines: [{ name: "Цемент", qty: "2,5", unit: "" }] };
    const result = await submitProcurementRequest(input, [], actor);
    expect(result.accessToken).toBeUndefined();
    expect((await submitProcurementRequest(input, [], actor)).id).toBe(result.id);
    await expect(submitProcurementRequest(input, [], null)).rejects.toMatchObject({ status: 409 });
  });
});

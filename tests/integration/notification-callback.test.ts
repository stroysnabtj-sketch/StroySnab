import { createHmac, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, expect, it, vi } from "vitest";
import { POST } from "@/app/api/notifications/sms/callback/route";
import { getDb } from "@/db";
import { auditLog, notificationAttempts, notificationOutbox } from "@/db/schema";
import { dispatchNotifications, retryNotification } from "@/modules/notifications/worker";

const secret = "a-test-callback-secret-long-enough";
const callbackUrl = "https://store.example.test/api/notifications/sms/callback";

function signedRequest(
  body: string,
  timestamp = String(Math.floor(Date.now() / 1000)),
  signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex"),
  url = callbackUrl,
) {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-sms-timestamp": timestamp,
      "x-sms-signature": signature,
    },
    body,
  });
}

async function acceptedMessage(messageId: string) {
  const db = await getDb();
  const id = randomUUID();
  await db.insert(notificationOutbox).values({
    id,
    eventKey: id,
    event: "ORDER_CREATED",
    entityId: randomUUID(),
    version: "1",
    audience: "customer",
    recipient: "+992900111224",
    body: "Private message",
  });
  async function accept() {
    await dispatchNotifications(
      db,
      { send: async () => ({ providerMessageId: messageId }) },
      { onlyIds: [id], batchSize: 1 },
    );
  }
  await accept();
  return {
    id,
    db,
    accept,
    row: async () =>
      (await db.select().from(notificationOutbox).where(eq(notificationOutbox.id, id)))[0],
    attempts: async () =>
      db.select().from(notificationAttempts).where(eq(notificationAttempts.notificationId, id)),
    clean: async () => {
      await db.delete(auditLog).where(eq(auditLog.entityId, id));
      await db.delete(notificationOutbox).where(eq(notificationOutbox.id, id));
    },
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it("authenticates the raw body and records a signed delivery on the accepted attempt", async () => {
  vi.stubEnv("NOTIFICATIONS_SMS_CALLBACK_SECRET", secret);
  const message = await acceptedMessage("known-message");
  vi.spyOn(Date, "now").mockReturnValue(1794000000000);
  const body = '{"messageId":"known-message","status":"DELIVERED"}';
  const signature = "c442042d57c4cfaf03011a0b0e31a039b706844f6fc0da674368f002ef5bfcda";
  try {
    expect((await message.row()).state).toBe("accepted");
    expect((await POST(signedRequest(body + " ", "1794000000", signature))).status).toBe(401);
    const response = await POST(signedRequest(body, "1794000000", signature));
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(await message.row()).toMatchObject({
      state: "delivered",
      lastError: null,
      deliveredAt: expect.any(Date),
    });
    expect(await message.attempts()).toEqual([
      expect.objectContaining({ state: "delivered", error: null }),
    ]);
  } finally {
    await message.clean();
  }
});

it("rejects insecure, expired, invalid and oversized callbacks before updating an accepted message", async () => {
  const messageId = randomUUID();
  const message = await acceptedMessage(messageId);
  const body = JSON.stringify({ messageId, status: "DELIVERED" });
  try {
    vi.stubEnv("NOTIFICATIONS_SMS_CALLBACK_SECRET", "");
    expect((await POST(signedRequest(body))).status).toBe(503);
    vi.stubEnv("NOTIFICATIONS_SMS_CALLBACK_SECRET", secret);
    expect(
      (
        await POST(
          signedRequest(body, undefined, undefined, callbackUrl.replace("https:", "http:")),
        )
      ).status,
    ).toBe(403);
    expect(
      (await POST(signedRequest(body, String(Math.floor(Date.now() / 1000) - 301)))).status,
    ).toBe(401);
    expect((await POST(signedRequest(body, undefined, "0".repeat(64)))).status).toBe(401);
    expect((await POST(signedRequest(body + " ".repeat(4096)))).status).toBe(413);
    const unknown = await POST(
      signedRequest(JSON.stringify({ messageId: randomUUID(), status: "DELIVERED" })),
    );
    expect(unknown.status).toBe(503);
    expect(unknown.headers.get("retry-after")).toBe("5");
    expect(await unknown.text()).toBe("");
    expect(await message.row()).toMatchObject({ state: "accepted", deliveredAt: null });
  } finally {
    await message.clean();
  }
});

it("ignores exact replay across a retry and preserves delivery across out-of-order failures", async () => {
  vi.stubEnv("NOTIFICATIONS_SMS_CALLBACK_SECRET", secret);
  const messageId = randomUUID();
  const message = await acceptedMessage(messageId);
  const failure = JSON.stringify({ messageId, status: "FAILED" });
  const delivered = JSON.stringify({ messageId, status: "DELIVERED" });
  const timestamp = String(Math.floor(Date.now() / 1000));
  try {
    expect((await POST(signedRequest(failure, timestamp))).status).toBe(204);
    expect(await message.row()).toMatchObject({
      state: "failed",
      lastError: "provider_delivery_failed",
      deliveredAt: null,
    });
    expect(await message.attempts()).toEqual([
      expect.objectContaining({ state: "failed", error: "provider_delivery_failed" }),
    ]);
    await retryNotification(message.db, message.id);
    await message.accept();
    expect((await POST(signedRequest(failure, timestamp))).status).toBe(204);
    expect((await message.row()).state).toBe("accepted");

    const later = String(Number(timestamp) + 1);
    expect((await POST(signedRequest(failure, later))).status).toBe(204);
    expect((await message.row()).state).toBe("failed");
    expect((await POST(signedRequest(delivered, timestamp))).status).toBe(204);
    const deliveredAt = (await message.row()).deliveredAt;
    expect(deliveredAt).toBeInstanceOf(Date);
    expect((await POST(signedRequest(failure, String(Number(timestamp) + 2)))).status).toBe(204);
    expect((await POST(signedRequest(delivered, timestamp))).status).toBe(204);
    expect(await message.row()).toMatchObject({ state: "delivered", deliveredAt, lastError: null });
    expect((await message.attempts()).map((attempt) => attempt.state).sort()).toEqual([
      "delivered",
      "failed",
    ]);
  } finally {
    await message.clean();
  }
});

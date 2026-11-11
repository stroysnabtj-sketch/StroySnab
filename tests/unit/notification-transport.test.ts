import { afterEach, expect, it, vi } from "vitest";
import { configuredNotificationTransport } from "@/modules/notifications/transport";

afterEach(() => vi.unstubAllGlobals());
const env = {
  NOTIFICATIONS_SMS_ENABLED: "true",
  NOTIFICATIONS_SMS_SEND_URL: "https://sms.example.test/send",
  NOTIFICATIONS_SMS_SEND_TOKEN: "private",
  NOTIFICATIONS_SMS_SENDER: "Store",
};
it("requires explicitly enabled operational SMS settings separately from login codes", () => {
  expect(
    configuredNotificationTransport({
      AUTH_SMS_SEND_URL: env.NOTIFICATIONS_SMS_SEND_URL,
      AUTH_SMS_SEND_TOKEN: "private",
    }),
  ).toBeNull();
  expect(
    configuredNotificationTransport({ ...env, NOTIFICATIONS_SMS_ENABLED: "false" }),
  ).toBeNull();
  expect(
    configuredNotificationTransport({
      ...env,
      NOTIFICATIONS_SMS_SEND_URL: "http://sms.example.test",
    }),
  ).toBeNull();
  expect(
    configuredNotificationTransport({
      ...env,
      NOTIFICATIONS_SMS_SEND_URL: "https://user:pass@sms.example.test",
    }),
  ).toBeNull();
});
it("uses a stable idempotency key and requires explicit provider acceptance", async () => {
  const requests: RequestInit[] = [];
  vi.stubGlobal("fetch", async (_url: URL, options: RequestInit) => {
    requests.push(options);
    return Response.json({ accepted: true, messageId: "message-1", delivered: true });
  });
  const transport = configuredNotificationTransport(env)!;
  const message = {
    recipient: "+992900111224",
    body: "Заказ принят",
    idempotencyKey: "same-event",
  };
  expect(await transport.send(message)).toEqual({ providerMessageId: "message-1" });
  expect(requests[0].headers).toMatchObject({ "Idempotency-Key": "same-event" });
  vi.stubGlobal("fetch", async () => Response.json({ delivered: true }));
  await expect(transport.send(message)).rejects.toThrow("provider_send_failed");
});

it("uses Payom's SMS payload and reads its accepted message ID", async () => {
  const send = vi.fn<typeof fetch>(async () => Response.json({ id: "payom-1" }, { status: 201 }));
  vi.stubGlobal("fetch", send);
  const transport = configuredNotificationTransport({
    ...env,
    NOTIFICATIONS_SMS_PROVIDER: "payom",
  })!;
  expect(
    await transport.send({
      recipient: "+992900111224",
      body: "Заказ принят",
      idempotencyKey: "one",
    }),
  ).toEqual({ providerMessageId: "payom-1" });
  expect(JSON.parse(send.mock.calls[0][1]?.body as string)).toEqual({
    telephone: "+992900111224",
    text: "Заказ принят",
    senderName: "Store",
    type: "SMS",
  });
  expect(transport.retrySafe).toBe(false);
});

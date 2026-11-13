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
    NOTIFICATIONS_SMS_ORDER_TEMPLATE_ID: "66c03e11-d52b-403b-905a-7761080d3d7c",
    NOTIFICATIONS_SMS_ADMIN_TEMPLATE_ID: "cfb6a23b-08b5-47f6-ac43-30cb1d455aee",
  })!;
  expect(
    await transport.send({
      recipient: "+992900111224",
      body: "Заказ принят",
      idempotencyKey: "one",
      event: "ORDER_CONFIRMED",
      audience: "customer",
      orderNumber: "ORD-001",
      statusLabel: "подтверждён",
    }),
  ).toEqual({ providerMessageId: "payom-1" });
  expect(JSON.parse(send.mock.calls[0][1]?.body as string)).toEqual({
    telephone: "+992900111224",
    templateMessage: {
      templateId: "66c03e11-d52b-403b-905a-7761080d3d7c",
      variables: { order: "ORD-001", status: "подтверждён" },
    },
    senderName: "Store",
    type: "SMS",
  });
  expect(transport.retrySafe).toBe(false);
});

it("uses the admin template and accepts Payom string IDs without sending private links", async () => {
  const send = vi.fn<typeof fetch>(async () => Response.json("message-id", { status: 201 }));
  vi.stubGlobal("fetch", send);
  const transport = configuredNotificationTransport({
    ...env,
    NOTIFICATIONS_SMS_PROVIDER: "payom",
    NOTIFICATIONS_SMS_ORDER_TEMPLATE_ID: "status",
    NOTIFICATIONS_SMS_ADMIN_TEMPLATE_ID: "admin",
  })!;
  await transport.send({
    recipient: "+992900111224",
    body: "private link",
    idempotencyKey: "admin-event",
    event: "ORDER_CREATED",
    audience: "admin",
    orderNumber: "ORD-2",
  });
  expect(JSON.parse(send.mock.calls[0][1]?.body as string).templateMessage).toEqual({
    templateId: "admin",
    variables: { order: "ORD-2" },
  });
  await expect(
    transport.send({
      recipient: "+992900111224",
      body: "КП готово",
      idempotencyKey: "quote",
      event: "QUOTE_READY",
    }),
  ).rejects.toThrow();
  expect(send).toHaveBeenCalledTimes(1);
});

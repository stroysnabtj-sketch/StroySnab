import { expect, it, vi, afterEach } from "vitest";
import { configuredNotificationTransport } from "@/modules/notifications/transport";
afterEach(() => vi.unstubAllGlobals());
it.each(["QUOTE_READY", "REQUEST_RECEIVED"])(
  "sends %s through the request template without links",
  async (event) => {
    const send = vi.fn<typeof fetch>(async () => Response.json("payom-quote", { status: 201 }));
    vi.stubGlobal("fetch", send);
    const transport = configuredNotificationTransport({
      NOTIFICATIONS_SMS_ENABLED: "true",
      NOTIFICATIONS_SMS_SEND_URL: "https://gateway.example.test/api/message",
      NOTIFICATIONS_SMS_SEND_TOKEN: "fake",
      NOTIFICATIONS_SMS_SENDER: "StroySnab",
      NOTIFICATIONS_SMS_PROVIDER: "payom",
      NOTIFICATIONS_SMS_ORDER_TEMPLATE_ID: "approved-status",
      NOTIFICATIONS_SMS_ADMIN_TEMPLATE_ID: "approved-admin",
      NOTIFICATIONS_SMS_REQUEST_TEMPLATE_ID: "approved-request",
    })!;
    expect(transport.supportedEvents).toContain("QUOTE_READY");
    expect(transport.supportedEvents).toContain("REQUEST_RECEIVED");
    await transport.send({
      recipient: "+992990000000",
      event,
      audience: "customer",
      orderNumber: "RFQ-0002",
      statusLabel: "КП готово",
      body: "КП готово",
      idempotencyKey: "quote-status",
    });
    expect(JSON.parse(send.mock.calls[0][1]!.body as string)).toMatchObject({
      templateMessage: {
        templateId: "approved-request",
        variables: { "number-1": "RFQ-0002", "text-1": "КП готово" },
      },
    });
    expect(JSON.stringify(send.mock.calls[0][1]!.body)).not.toContain("https://");
  },
);

it("reports Payom's forbidden template variables without exposing provider data", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>(async () =>
      Response.json(
        {
          violations: [
            {
              propertyPath: "templateMessage.variables[text-1]",
              message: 'Переменная "text-1" запрещена',
            },
          ],
        },
        { status: 422 },
      ),
    ),
  );
  const transport = configuredNotificationTransport({
    NOTIFICATIONS_SMS_ENABLED: "true",
    NOTIFICATIONS_SMS_SEND_URL: "https://gateway.example.test/api/message",
    NOTIFICATIONS_SMS_SEND_TOKEN: "fake",
    NOTIFICATIONS_SMS_SENDER: "StroySnab",
    NOTIFICATIONS_SMS_PROVIDER: "payom",
    NOTIFICATIONS_SMS_ORDER_TEMPLATE_ID: "status",
    NOTIFICATIONS_SMS_ADMIN_TEMPLATE_ID: "admin",
  })!;
  await expect(
    transport.send({
      recipient: "+992990000000",
      event: "ORDER_CREATED",
      audience: "customer",
      orderNumber: "ORD-1",
      statusLabel: "принят",
      body: "",
      idempotencyKey: "one",
    }),
  ).rejects.toThrow("sms_template_variables_forbidden");
});

it("does not send request statuses through an order template when the request template is missing", async () => {
  const send = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", send);
  const transport = configuredNotificationTransport({
    NOTIFICATIONS_SMS_ENABLED: "true",
    NOTIFICATIONS_SMS_SEND_URL: "https://gateway.example.test/api/message",
    NOTIFICATIONS_SMS_SEND_TOKEN: "fake",
    NOTIFICATIONS_SMS_SENDER: "StroySnab",
    NOTIFICATIONS_SMS_PROVIDER: "payom",
    NOTIFICATIONS_SMS_ORDER_TEMPLATE_ID: "order",
    NOTIFICATIONS_SMS_ADMIN_TEMPLATE_ID: "admin",
  })!;
  await expect(
    transport.send({
      recipient: "+992990000000",
      event: "REQUEST_RECEIVED",
      audience: "customer",
      orderNumber: "RFQ-003",
      statusLabel: "Принята",
      body: "",
      idempotencyKey: "req",
    }),
  ).rejects.toThrow("unsupported_notification_template");
  expect(send).not.toHaveBeenCalled();
});

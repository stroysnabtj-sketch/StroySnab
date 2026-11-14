import { expect, it, vi, afterEach } from "vitest";
import { configuredNotificationTransport } from "@/modules/notifications/transport";
afterEach(() => vi.unstubAllGlobals());
it("sends quote-ready through the approved status template without links", async () => {
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
  })!;
  expect(transport.supportedEvents).toContain("QUOTE_READY");
  expect(transport.supportedEvents).toContain("REQUEST_RECEIVED");
  await transport.send({
    recipient: "+992990000000",
    event: "QUOTE_READY",
    audience: "customer",
    orderNumber: "RFQ-0002",
    statusLabel: "КП готово",
    body: "КП готово",
    idempotencyKey: "quote-status",
  });
  expect(JSON.parse(send.mock.calls[0][1]!.body as string)).toMatchObject({
    templateMessage: {
      templateId: "approved-status",
      variables: { order: "RFQ-0002", status: "КП готово" },
    },
  });
  expect(JSON.stringify(send.mock.calls[0][1]!.body)).not.toContain("https://");
});

it("reports Payom's forbidden template variables without exposing provider data", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>(async () =>
      Response.json(
        {
          violations: [
            {
              propertyPath: "templateMessage.variables[status]",
              message: 'Переменная "status" запрещена',
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

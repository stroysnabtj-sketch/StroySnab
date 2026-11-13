import { afterEach, expect, it, vi } from "vitest";
import { sendContactCode } from "@/modules/auth/code-delivery";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function configurePayom() {
  vi.stubEnv("AUTH_SMS_PROVIDER", "payom");
  vi.stubEnv("AUTH_SMS_SEND_URL", "https://gateway.payom.tj/api/message");
  vi.stubEnv("AUTH_SMS_SEND_TOKEN", "test-token");
  vi.stubEnv("AUTH_SMS_SENDER", "StroySnab");
  vi.stubEnv("AUTH_SMS_TEMPLATE_ID", "6c09ead9-41bc-434e-a05b-fd5180d1f882");
}

const message = {
  channel: "sms" as const,
  recipient: "+992990900341",
  code: "012345",
  expiresInSeconds: 300,
};

it("sends contact codes using the approved Payom template, preserving leading zeroes", async () => {
  configurePayom();
  const send = vi.fn<typeof fetch>(async () =>
    Response.json({ id: "accepted-id" }, { status: 201 }),
  );
  vi.stubGlobal("fetch", send);
  await sendContactCode(message);
  expect(JSON.parse(send.mock.calls[0][1]?.body as string)).toEqual({
    telephone: message.recipient,
    senderName: "StroySnab",
    type: "SMS",
    templateMessage: {
      templateId: "6c09ead9-41bc-434e-a05b-fd5180d1f882",
      variables: { code: "012345" },
    },
  });
});

it("does not spend an SMS request when the Payom template is missing", async () => {
  configurePayom();
  vi.stubEnv("AUTH_SMS_TEMPLATE_ID", "");
  const send = vi.fn();
  vi.stubGlobal("fetch", send);
  await expect(sendContactCode(message)).rejects.toMatchObject({
    code: "code_delivery_unavailable",
  });
  expect(send).not.toHaveBeenCalled();
});

it("rejects a Payom response without an accepted message ID", async () => {
  configurePayom();
  vi.stubGlobal("fetch", async () => Response.json({ error: "rejected" }, { status: 422 }));
  await expect(sendContactCode(message)).rejects.toMatchObject({ code: "code_delivery_failed" });
});

it("accepts Payom's JSON string message ID response", async () => {
  configurePayom();
  vi.stubGlobal("fetch", async () =>
    Response.json("b6127d9e-cf26-43ba-827c-dca21456d732", { status: 201 }),
  );
  await expect(sendContactCode(message)).resolves.toBeUndefined();
});

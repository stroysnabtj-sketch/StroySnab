export type SmsTransport = {
  send(message: {
    recipient: string;
    body: string;
    idempotencyKey: string;
  }): Promise<{ providerMessageId: string }>;
};

/** Separate from AUTH_SMS_*; explicit activation is required, never enabled by default. */
export function configuredNotificationTransport(
  env: Record<string, string | undefined> = process.env,
): SmsTransport | null {
  if (
    env.NOTIFICATIONS_SMS_ENABLED !== "true" ||
    !env.NOTIFICATIONS_SMS_SEND_URL ||
    !env.NOTIFICATIONS_SMS_SEND_TOKEN ||
    !env.NOTIFICATIONS_SMS_SENDER
  )
    return null;
  let endpoint: URL;
  try {
    endpoint = new URL(env.NOTIFICATIONS_SMS_SEND_URL);
  } catch {
    return null;
  }
  if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password) return null;
  const token = env.NOTIFICATIONS_SMS_SEND_TOKEN;
  const sender = env.NOTIFICATIONS_SMS_SENDER;
  return {
    async send(message) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Idempotency-Key": message.idempotencyKey,
        },
        body: JSON.stringify({
          sender,
          recipient: message.recipient,
          text: message.body,
          idempotencyKey: message.idempotencyKey,
        }),
        signal: AbortSignal.timeout(10000),
        redirect: "error",
        cache: "no-store",
      });
      if (!response.ok) throw new Error("provider_send_failed");
      const result = await response.json();
      if (
        result.accepted !== true ||
        typeof result.messageId !== "string" ||
        !result.messageId ||
        result.messageId.length > 200
      )
        throw new Error("provider_send_failed");
      return { providerMessageId: result.messageId };
    },
  };
}

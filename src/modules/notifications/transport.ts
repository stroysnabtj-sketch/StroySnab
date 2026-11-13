export type SmsTransport = {
  retrySafe?: boolean;
  supportedEvents?: string[];
  send(message: {
    recipient: string;
    body: string;
    idempotencyKey: string;
    event?: string;
    audience?: string;
    orderNumber?: string;
    statusLabel?: string;
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
  const payom = env.NOTIFICATIONS_SMS_PROVIDER === "payom";
  const orderTemplate = env.NOTIFICATIONS_SMS_ORDER_TEMPLATE_ID;
  const adminTemplate = env.NOTIFICATIONS_SMS_ADMIN_TEMPLATE_ID;
  if (payom && (!orderTemplate || !adminTemplate)) return null;
  return {
    retrySafe: !payom,
    ...(payom
      ? {
          supportedEvents: [
            "ORDER_CREATED",
            "ORDER_CONFIRMED",
            "ORDER_DISPATCHED",
            "ORDER_DELIVERED",
            "ORDER_CANCELLED",
            "PAYMENT_CONFIRMED",
          ],
        }
      : {}),
    async send(message) {
      const admin = message.audience === "admin" && message.event === "ORDER_CREATED";
      if (
        payom &&
        (!message.orderNumber ||
          (!admin && (!message.statusLabel || message.audience !== "customer")))
      )
        throw new Error("unsupported_notification_template");
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Idempotency-Key": message.idempotencyKey,
        },
        body: JSON.stringify(
          payom
            ? {
                telephone: message.recipient,
                templateMessage: {
                  templateId: admin ? adminTemplate : orderTemplate,
                  variables: admin
                    ? { order: message.orderNumber }
                    : { order: message.orderNumber, status: message.statusLabel },
                },
                senderName: sender,
                type: "SMS",
              }
            : {
                sender,
                recipient: message.recipient,
                text: message.body,
                idempotencyKey: message.idempotencyKey,
              },
        ),
        signal: AbortSignal.timeout(10000),
        redirect: "error",
        cache: "no-store",
      });
      if (!response.ok) throw new Error("provider_send_failed");
      const result = await response.json();
      if (payom) {
        const id = typeof result === "string" ? result : result?.id;
        if (response.status !== 201 || typeof id !== "string" || !id.trim() || id.length > 200)
          throw new Error("provider_send_failed");
        return { providerMessageId: id };
      }
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

export function configuredNotificationEmail(
  env: Record<string, string | undefined> = process.env,
): SmsTransport | null {
  const token = env.NOTIFICATIONS_RESEND_API_KEY;
  const from = env.NOTIFICATIONS_EMAIL_FROM;
  if (env.NOTIFICATIONS_EMAIL_ENABLED !== "true" || !token || !from) return null;
  return {
    async send(message) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Idempotency-Key": message.idempotencyKey,
        },
        body: JSON.stringify({
          from,
          to: [message.recipient],
          subject: "Статус заказа StroySnab",
          text: message.body,
        }),
        signal: AbortSignal.timeout(10000),
        redirect: "error",
        cache: "no-store",
      });
      if (!response.ok) throw new Error("provider_send_failed");
      const result = await response.json();
      if (typeof result.id !== "string" || !result.id || result.id.length > 200)
        throw new Error("provider_send_failed");
      return { providerMessageId: result.id };
    },
  };
}

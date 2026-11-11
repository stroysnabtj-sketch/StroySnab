import { ApiError } from "@/server/api-error";
export type CodeMessage = {
  channel: "sms" | "email";
  recipient: string;
  code: string;
  expiresInSeconds: number;
};
export type CodeDelivery = (message: CodeMessage) => Promise<void>;
/** Server-to-server adapter for a future SMS/email gateway. Never returns or logs codes. */
export const sendContactCode: CodeDelivery = async (message) => {
  const prefix = message.channel === "sms" ? "AUTH_SMS" : "AUTH_EMAIL";
  const payom = message.channel === "sms" && process.env.AUTH_SMS_PROVIDER === "payom";
  const resend = message.channel === "email" && process.env.AUTH_EMAIL_PROVIDER === "resend";
  const senderName = process.env.AUTH_SMS_SENDER ?? process.env.NOTIFICATIONS_SMS_SENDER;
  const from = process.env.NOTIFICATIONS_EMAIL_FROM;
  const endpoint = resend ? "https://api.resend.com/emails" : process.env[`${prefix}_SEND_URL`];
  const token =
    process.env[`${prefix}_SEND_TOKEN`] ??
    (payom
      ? process.env.NOTIFICATIONS_SMS_SEND_TOKEN
      : resend
        ? process.env.NOTIFICATIONS_RESEND_API_KEY
        : undefined);
  if (!endpoint || !token || (payom && !senderName) || (resend && !from))
    throw new ApiError(
      503,
      "code_delivery_unavailable",
      message.channel === "sms"
        ? "Отправка SMS пока не подключена"
        : "Отправка писем пока не подключена",
    );
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new ApiError(503, "code_delivery_unavailable", "Отправка кодов временно недоступна");
  }
  if (
    url.protocol !== "https:" &&
    !(
      process.env.NODE_ENV !== "production" &&
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  )
    throw new ApiError(503, "code_delivery_unavailable", "Отправка кодов временно недоступна");
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(
        payom
          ? {
              telephone: message.recipient,
              text: `Код StroySnab: ${message.code}`,
              senderName,
              type: "SMS",
            }
          : resend
            ? {
                from,
                to: [message.recipient],
                subject: "Код StroySnab",
                text: `Код StroySnab: ${message.code}`,
              }
            : {
                template: "login_code",
                recipient: message.recipient,
                code: message.code,
                expiresInSeconds: message.expiresInSeconds,
              },
      ),
      signal: AbortSignal.timeout(10000),
      redirect: "error",
      cache: "no-store",
    });
    if (!response.ok) throw new Error("delivery rejected");
    const result = await response.json();
    if (
      payom
        ? response.status !== 201 || typeof result.id !== "string" || !result.id
        : resend
          ? typeof result.id !== "string" || !result.id
          : result.accepted !== true
    )
      throw new Error("delivery rejected");
  } catch {
    throw new ApiError(503, "code_delivery_failed", "Не удалось отправить код. Попробуйте позже");
  }
};

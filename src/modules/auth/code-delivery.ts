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
  const endpoint = process.env[`${prefix}_SEND_URL`],
    token = process.env[`${prefix}_SEND_TOKEN`];
  if (!endpoint || !token)
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
      body: JSON.stringify({
        template: "login_code",
        recipient: message.recipient,
        code: message.code,
        expiresInSeconds: message.expiresInSeconds,
      }),
      signal: AbortSignal.timeout(10000),
      redirect: "error",
      cache: "no-store",
    });
    if (!response.ok) throw new Error("delivery rejected");
    const result = await response.json();
    if (result.accepted !== true) throw new Error("delivery rejected");
  } catch {
    throw new ApiError(503, "code_delivery_failed", "Не удалось отправить код. Попробуйте позже");
  }
};

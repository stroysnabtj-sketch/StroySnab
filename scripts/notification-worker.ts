import { closeDb, getDb } from "../src/db";
import {
  configuredNotificationTransport,
  configuredNotificationEmail,
} from "../src/modules/notifications/transport";
import { dispatchNotifications } from "../src/modules/notifications/worker";

async function main() {
  for (const [channel, transport] of [
    ["sms", configuredNotificationTransport()],
    ["email", configuredNotificationEmail()],
  ] as const) {
    if (!transport) continue;
    const cutover = process.env.NOTIFICATIONS_SEND_AFTER;
    const createdSince = cutover ? new Date(cutover) : undefined;
    if (
      (process.env.NODE_ENV === "production" && !createdSince) ||
      (createdSince && !Number.isFinite(createdSince.getTime()))
    )
      throw new Error("Set NOTIFICATIONS_SEND_AFTER to the activation timestamp");
    const key =
      channel === "sms" ? "NOTIFICATIONS_SMS_DAILY_LIMIT" : "NOTIFICATIONS_EMAIL_DAILY_LIMIT";
    const dailyLimit = Number(process.env[key] ?? "100");
    if (!Number.isSafeInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 10000)
      throw new Error(`Invalid ${key}`);
    console.log({
      channel,
      ...(await dispatchNotifications(await getDb(), transport, {
        channel,
        dailyLimit,
        createdSince,
      })),
    });
  }
}
main()
  .catch(() => {
    console.error("Notification worker failed");
    process.exitCode = 1;
  })
  .finally(closeDb);

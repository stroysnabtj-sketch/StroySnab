import { closeDb, getDb } from "../src/db";
import { configuredNotificationTransport } from "../src/modules/notifications/transport";
import { dispatchNotifications } from "../src/modules/notifications/worker";

async function main() {
  const transport = configuredNotificationTransport();
  if (!transport) {
    console.log("SMS notifications are disconnected; no messages sent.");
    return;
  }
  const configuredLimit = Number(process.env.NOTIFICATIONS_SMS_DAILY_LIMIT ?? "100");
  if (!Number.isSafeInteger(configuredLimit) || configuredLimit < 1 || configuredLimit > 10000)
    throw new Error("Invalid NOTIFICATIONS_SMS_DAILY_LIMIT");
  console.log(
    await dispatchNotifications(await getDb(), transport, { dailyLimit: configuredLimit }),
  );
}
main()
  .catch(() => {
    console.error("Notification worker failed");
    process.exitCode = 1;
  })
  .finally(closeDb);

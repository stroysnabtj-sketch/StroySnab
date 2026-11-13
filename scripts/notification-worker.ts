import { Client } from "pg";
import { createNotificationWakeup } from "../src/modules/notifications/wakeup";
import { closeDb, getDb } from "../src/db";
import {
  configuredNotificationTransport,
  configuredNotificationEmail,
} from "../src/modules/notifications/transport";
import { dispatchNotifications } from "../src/modules/notifications/worker";

async function dispatchBatch() {
  let processed = 0;
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
    const result = await dispatchNotifications(await getDb(), transport, {
      channel,
      dailyLimit,
      createdSince,
    });
    processed += result.processed;
    if (result.processed || process.env.NOTIFICATIONS_WORKER_ONCE === "true")
      console.log({ channel, ...result });
  }
  return processed;
}
async function main() {
  if (process.env.NOTIFICATIONS_WORKER_ONCE === "true") {
    await dispatchBatch();
    return;
  }
  if (!process.env.DATABASE_URL) throw new Error("PostgreSQL required for notification listener");
  const listener = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
  });
  const wake = createNotificationWakeup();
  let stopping = false;
  let disconnected = false;
  const stop = () => {
    stopping = true;
    wake.notify();
  };
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
  listener.on("notification", wake.notify);
  listener.on("error", () => {
    disconnected = true;
    wake.notify();
  });
  try {
    await listener.connect();
    await listener.query("LISTEN stroysnab_notifications");
    console.log("Notification listener ready");
    while (!stopping) {
      const processed = await dispatchBatch();
      if (disconnected) throw new Error("Notification listener disconnected");
      if (!stopping && processed < 20) await wake.wait(10000);
    }
  } finally {
    process.removeListener("SIGTERM", stop);
    process.removeListener("SIGINT", stop);
    await listener.end();
  }
}
main()
  .catch(() => {
    console.error("Notification worker failed");
    process.exitCode = 1;
  })
  .finally(closeDb);

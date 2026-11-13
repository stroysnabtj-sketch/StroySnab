import { expect, it, vi } from "vitest";
import { createNotificationWakeup } from "@/modules/notifications/wakeup";

it("wakes immediately for committed events and retains events during dispatch", async () => {
  const wake = createNotificationWakeup();
  const done = vi.fn();
  const waiting = wake.wait(1000).then(done);
  wake.notify();
  await waiting;
  expect(done).toHaveBeenCalledOnce();
  wake.notify();
  wake.notify();
  await wake.wait(1000);
  expect(done).toHaveBeenCalledOnce();
});

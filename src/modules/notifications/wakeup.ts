/** Coalesces notifications and retains a wakeup received while a batch is being sent. */
export function createNotificationWakeup() {
  let pending = false;
  let resume: (() => void) | undefined;
  return {
    notify() {
      pending = true;
      resume?.();
    },
    async wait(timeoutMs = 10000) {
      if (!pending)
        await new Promise<void>((resolve) => {
          const timer = setTimeout(done, timeoutMs);
          function done() {
            clearTimeout(timer);
            resume = undefined;
            resolve();
          }
          resume = done;
        });
      pending = false;
    },
  };
}

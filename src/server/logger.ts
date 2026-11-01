import { maskPhone } from "@/modules/system/phone";

export function sanitizeLog(value: string): string {
  return value
    .replace(/\+?\d[\d\s()\-]{7,}\d/g, (match) => {
      const digits = match.replace(/[\s()\-]/g, "");
      return digits.length >= 8 && digits.length <= 15 ? maskPhone(digits) : match;
    })
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "***@***")
    .replace(/(token|secret|password|key|cookie|auth|code|session)=[^\s&",;]+/gi, "$1=<redacted>")
    .replace(/("token"|"secret"|"password"|"key"|"cookie"|"auth"|"code"|"session")\s*:\s*"[^"]+"/gi, '$1:"<redacted>"');
}

export const log = {
  info(event: string, data?: Record<string, unknown>) {
    console.log(sanitizeLog(JSON.stringify({ level: "info", event, ...data })));
  },
  error(event: string, error: unknown) {
    const errorString =
      error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ""}` : String(error);
    console.error(
      sanitizeLog(
        JSON.stringify({
          level: "error",
          event,
          error: errorString,
        }),
      ),
    );
  },
};

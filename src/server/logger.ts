import { maskPhone } from "@/modules/system/phone";

export function sanitizeLog(value: string): string {
  return value
    .replace(/\+?\d[\d\s()\-]{7,}\d/g, (match) => maskPhone(match.replace(/[\s()\-]/g, "")))
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "***@***")
    .replace(/(token|secret|password|key)=[^\s&]+/gi, "$1=<redacted>");
}

export const log = {
  info(event: string, data?: Record<string, unknown>) { console.log(JSON.stringify({ level: "info", event, ...data })); },
  error(event: string, error: unknown) { console.error(JSON.stringify({ level: "error", event, error: sanitizeLog(String(error)) })); },
};

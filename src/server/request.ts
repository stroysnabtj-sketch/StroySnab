import { createHash } from "node:crypto";

export function requestIp(request: Request): string {
  const trustedHeader = process.env.TRUSTED_PROXY_HEADER;
  if (trustedHeader) {
    const val = request.headers.get(trustedHeader);
    if (val) {
      const first = val.split(",")[0]?.trim();
      if (first) return first;
    }
  }

  const remote = request.headers.get("x-real-ip");
  const trustedProxy = process.env.TRUSTED_PROXY;
  if (trustedProxy && remote === trustedProxy) {
    return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? remote;
  }

  return "local";
}

export function requestFingerprint(request: Request, userContext?: string): string {
  const ip = requestIp(request);
  const ua = request.headers.get("user-agent") ?? "";
  const context = userContext ? `|${userContext}` : "";
  return createHash("sha256").update(`${ip}|${ua}${context}`).digest("hex").slice(0, 16);
}

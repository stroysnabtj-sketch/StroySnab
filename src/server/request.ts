import { createHash } from "node:crypto";
import { isIP } from "node:net";

export function requestIp(request: Request): string {
  const trustedHeader = process.env.TRUSTED_PROXY_HEADER?.trim().toLowerCase();
  if (trustedHeader) {
    const val = request.headers.get(trustedHeader);
    if (val) {
      const address = (trustedHeader === "x-forwarded-for" ? val.split(",")[0] : val).trim();
      if (isIP(address)) return address;
    }
  }

  const remote = request.headers.get("x-real-ip");
  const trustedProxy = process.env.TRUSTED_PROXY;
  if (remote && trustedProxy && remote === trustedProxy && isIP(remote)) {
    const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    return address && isIP(address) ? address : remote;
  }

  return "local";
}

export function requestFingerprint(request: Request, userContext?: string): string {
  const ip = requestIp(request);
  const ua = request.headers.get("user-agent") ?? "";
  const context = userContext ? `|${userContext}` : "";
  return createHash("sha256").update(`${ip}|${ua}${context}`).digest("hex").slice(0, 16);
}

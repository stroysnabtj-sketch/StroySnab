import { createHash } from "node:crypto";

export function requestIp(request: Request): string {
  const remote = request.headers.get("x-real-ip");
  const trusted = process.env.TRUSTED_PROXY;
  if (trusted && remote === trusted) return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? remote;
  return remote ?? "local";
}
export function requestFingerprint(request: Request): string {
  return createHash("sha256").update(`${requestIp(request)}|${request.headers.get("user-agent") ?? ""}`).digest("hex").slice(0, 16);
}

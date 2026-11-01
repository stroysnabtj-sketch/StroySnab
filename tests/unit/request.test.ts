import { describe, expect, it } from "vitest";
import { requestIp, requestFingerprint } from "@/server/request";
import { assertSameOrigin, checkPayloadSize } from "@/server/security";
import { parseJsonBody } from "@/server/validation";

describe("request and security utils", () => {
  it("determines request IP safely", () => {
    // When no trusted proxy is configured, direct client spoofed headers are not blindly trusted
    delete process.env.TRUSTED_PROXY;
    delete process.env.TRUSTED_PROXY_HEADER;

    const reqSpoofed = new Request("http://localhost:3000/api/test", {
      headers: { "x-real-ip": "1.2.3.4", "x-forwarded-for": "5.6.7.8" },
    });
    expect(requestIp(reqSpoofed)).toBe("local");

    // When trusted proxy header is configured
    process.env.TRUSTED_PROXY_HEADER = "x-forwarded-for";
    const reqTrusted = new Request("http://localhost:3000/api/test", {
      headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18" },
    });
    expect(requestIp(reqTrusted)).toBe("203.0.113.195");
    delete process.env.TRUSTED_PROXY_HEADER;
  });

  it("builds deterministic request fingerprint with user context", () => {
    const req1 = new Request("http://localhost:3000/api/test", {
      headers: { "user-agent": "Mozilla/5.0" },
    });
    const fp1 = requestFingerprint(req1, "user-123");
    const fp2 = requestFingerprint(req1, "user-123");
    const fpOtherUser = requestFingerprint(req1, "user-456");

    expect(fp1).toBe(fp2);
    expect(fp1).not.toBe(fpOtherUser);
  });

  it("enforces same-origin policy on mutating requests", () => {
    process.env.APP_URL = "http://localhost:3000";

    const allowedReq = new Request("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { origin: "http://localhost:3000" },
    });
    expect(() => assertSameOrigin(allowedReq)).not.toThrow();

    const crossSiteReq = new Request("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { origin: "https://evil-site.com" },
    });
    expect(() => assertSameOrigin(crossSiteReq)).toThrow();

    const fetchMetadataCrossSite = new Request("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "sec-fetch-site": "cross-site" },
    });
    expect(() => assertSameOrigin(fetchMetadataCrossSite)).toThrow();
  });

  it("enforces payload size limit with 413", () => {
    const hugeReq = new Request("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "content-length": "2000000" }, // 2 MB
    });
    expect(() => checkPayloadSize(hugeReq, 1024 * 1024)).toThrow(); // 1 MB limit
  });

  it("parses JSON body safely, throwing 400 on invalid JSON syntax", async () => {
    const badReq = new Request("http://localhost:3000/api/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{ invalid json",
    });
    await expect(parseJsonBody(badReq)).rejects.toThrow();
  });
});


import { describe, expect, it, vi } from "vitest";
import { requestIp, requestFingerprint } from "@/server/request";
import { assertSameOrigin, checkPayloadSize } from "@/server/security";
import { parseJsonBody } from "@/server/validation";
import { ApiError, errorResponse } from "@/server/api-error";

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

  it("accepts a single validated address from a configured X-Real-IP header", () => {
    vi.stubEnv("TRUSTED_PROXY_HEADER", "x-real-ip");
    vi.stubEnv("TRUSTED_PROXY", undefined);
    try {
      const request = (value: string) =>
        new Request("https://shop.example/api/auth/login", { headers: { "x-real-ip": value } });
      expect(requestIp(request("2001:db8::1"))).toBe("2001:db8::1");
      expect(requestIp(request("spoofed"))).toBe("local");
      expect(requestIp(request("192.0.2.1, 192.0.2.2"))).toBe("local");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("keeps private error responses out of caches while retaining retry headers", () => {
    const response = errorResponse(
      new ApiError(429, "rate_limited", "Повторите позже", undefined, { "Retry-After": "60" }),
    );
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
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

  it("accepts the configured public domain behind an internal proxy and rejects spoofed hosts", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "https://legacy-deployment.up.railway.app");
    vi.stubEnv("SITE_URL", "https://www.stroysnab.tj");
    try {
      const request = (origin: string) =>
        new Request("http://0.0.0.0:8080/api/auth/code/request", {
          method: "POST",
          headers: {
            origin,
            "sec-fetch-site": "same-origin",
            "x-forwarded-host": "www.stroysnab.tj",
          },
        });
      expect(() => assertSameOrigin(request("https://www.stroysnab.tj"))).not.toThrow();
      expect(() => assertSameOrigin(request("https://evil.example"))).toThrow();
    } finally {
      vi.unstubAllEnvs();
    }
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

  it("rejects an oversized JSON body even without an accurate Content-Length", async () => {
    const headerCases: HeadersInit[] = [{}, { "content-length": "2" }];
    for (const headers of headerCases) {
      const request = new Request("http://localhost:3000/api/test", {
        method: "POST",
        headers,
        body: JSON.stringify({ value: "x".repeat(100) }),
      });
      await expect(parseJsonBody(request, 32)).rejects.toMatchObject({ status: 413 });
    }
  });
});

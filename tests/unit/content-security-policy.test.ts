import { expect, it } from "vitest";
import { buildContentSecurityPolicy } from "@/server/content-security-policy";
it("uses nonce scripts and explicit integrations without eval in production", () => {
  const policy = buildContentSecurityPolicy("testNonce123", false);
  expect(policy).toContain("'nonce-testNonce123'");
  expect(policy).toContain("https://challenges.cloudflare.com");
  expect(policy).not.toContain("unsafe-eval");
  expect(policy).not.toContain("script-src 'self' 'unsafe-inline'");
  expect(policy).toContain("object-src 'none'");
  expect(policy).toContain("frame-ancestors 'none'");
});
it("only permits eval for local development", () =>
  expect(buildContentSecurityPolicy("test", true)).toContain("'unsafe-eval'"));

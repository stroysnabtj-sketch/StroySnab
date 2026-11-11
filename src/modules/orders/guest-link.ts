import { createHmac, timingSafeEqual } from "node:crypto";

const lifetimeSeconds = 30 * 86400;

function signature(id: string, accessHash: string, expires: number) {
  const secret = process.env.ORDER_GUEST_LINK_SECRET;
  if (!secret || secret.length < 32) return null;
  return createHmac("sha256", secret)
    .update(JSON.stringify(["order-status", id, accessHash, expires]))
    .digest("base64url");
}

export function guestOrderLink(id: string, accessHash: string, createdAt: Date) {
  const expires = Math.floor(createdAt.getTime() / 1000) + lifetimeSeconds;
  const proof = signature(id, accessHash, expires);
  if (!proof || expires <= Date.now() / 1000) return null;
  try {
    const base = new URL(process.env.APP_URL ?? "");
    if (base.protocol !== "https:" || base.username || base.password) return null;
    return new URL(`/orders/${id}/open#${expires}.${proof}`, base.origin).href;
  } catch {
    return null;
  }
}

export function verifyGuestOrderLink(id: string, accessHash: string, token: string) {
  const match = /^(\d{10})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) return false;
  const expires = Number(match[1]);
  if (expires <= Date.now() / 1000) return false;
  const proof = signature(id, accessHash, expires);
  return !!proof && timingSafeEqual(Buffer.from(proof), Buffer.from(match[2]));
}

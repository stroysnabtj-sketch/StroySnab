/** Public indexing host, independent of internal login/notification callback URLs. */
export function publicSiteOrigin() {
  const configured = process.env.SITE_URL?.trim();
  const fallback =
    process.env.NODE_ENV === "production"
      ? "https://www.stroysnab.tj"
      : process.env.APP_URL || "http://localhost:3000";
  const url = new URL(configured || fallback);
  if (url.protocol !== "https:" && url.protocol !== "http:")
    throw new Error("SITE_URL must use HTTP or HTTPS");
  return url.origin;
}

/** Explicit server configuration only: never trust a client-supplied forwarded host. */
export function configuredApplicationOrigins() {
  const origins = new Set([publicSiteOrigin()]);
  if (process.env.APP_URL) {
    try {
      const url = new URL(process.env.APP_URL);
      if (url.protocol === "https:" || url.protocol === "http:") origins.add(url.origin);
    } catch {
      // An invalid optional callback URL must not admit an unconfigured origin.
    }
  }
  return origins;
}

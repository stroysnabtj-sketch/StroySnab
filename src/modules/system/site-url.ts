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

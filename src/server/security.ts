import { ApiError } from "./api-error";

export function assertSameOrigin(request: Request): void {
  // Check Fetch Metadata
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") {
    throw new ApiError(403, "cross_site_forbidden", "Межсайтовые запросы запрещены");
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    // Non-browser or same-origin navigation where Origin is omitted
    return;
  }

  const allowedOrigins = new Set<string>();
  if (process.env.APP_URL) {
    try {
      allowedOrigins.add(new URL(process.env.APP_URL).origin);
    } catch {
      // ignore malformed env URL
    }
  }

  try {
    const requestUrl = new URL(request.url);
    allowedOrigins.add(requestUrl.origin);
  } catch {
    // ignore
  }

  // Also allow common local dev origins if in development or test
  if (process.env.NODE_ENV !== "production") {
    allowedOrigins.add("http://localhost:3000");
    allowedOrigins.add("http://127.0.0.1:3000");
  }

  let requestOrigin: string;
  try {
    requestOrigin = new URL(origin).origin;
  } catch {
    throw new ApiError(403, "origin_mismatch", "Недопустимый источник запроса");
  }

  if (!allowedOrigins.has(requestOrigin)) {
    throw new ApiError(403, "origin_mismatch", "Недопустимый источник запроса");
  }
}

export function checkPayloadSize(request: Request, maxBytes = 1024 * 1024): void {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (!isNaN(size) && size > maxBytes) {
      throw new ApiError(413, "payload_too_large", "Превышен максимальный размер запроса");
    }
  }
}


import { NextResponse, type NextRequest } from "next/server";
import { buildContentSecurityPolicy } from "./server/content-security-policy";
export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const policy = buildContentSecurityPolicy(nonce, process.env.NODE_ENV !== "production");
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  if (
    process.env.NODE_ENV === "production" &&
    (request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https")
  )
    response.headers.set("Strict-Transport-Security", "max-age=31536000");
  return response;
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.svg|robots.txt|sitemap.xml|images/|media/).*)",
  ],
};

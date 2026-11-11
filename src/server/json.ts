import { NextResponse } from "next/server";

export function jsonResponse(data: unknown, init?: ResponseInit): NextResponse {
  const body = JSON.stringify(data, (_, value) =>
    typeof value === "bigint" ? value.toString() : value,
  );
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (!headers.has("Cache-Control")) headers.set("Cache-Control", "private, no-store");
  return new NextResponse(body, {
    ...init,
    headers,
  });
}


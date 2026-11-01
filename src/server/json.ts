import { NextResponse } from "next/server";

export function jsonResponse(data: unknown, init?: ResponseInit): NextResponse {
  const body = JSON.stringify(data, (_, value) =>
    typeof value === "bigint" ? value.toString() : value,
  );
  return new NextResponse(body, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}


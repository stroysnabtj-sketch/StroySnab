import { NextRequest, NextResponse } from "next/server";
import { searchSuggestions } from "@/modules/catalog/service";
import { errorResponse } from "@/server/api-error";

export async function GET(request: NextRequest) {
  try {
    const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 120);
    return NextResponse.json({ items: await searchSuggestions(q) });
  } catch (error) {
    return errorResponse(error);
  }
}

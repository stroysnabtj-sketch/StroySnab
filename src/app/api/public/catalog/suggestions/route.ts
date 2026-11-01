import { NextRequest, NextResponse } from "next/server";
import { searchSuggestions } from "@/modules/catalog/service";
export async function GET(request: NextRequest) { const q = request.nextUrl.searchParams.get("q") ?? ""; return NextResponse.json({ items: await searchSuggestions(q) }); }

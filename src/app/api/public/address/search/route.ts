import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin } from "@/server/security";
import { consumeRateLimit } from "@/server/rate-limit";
import { requestIp } from "@/server/request";
import { ApiError, errorResponse } from "@/server/api-error";

export type AddressSearchResult = {
  label: string;
  city: string;
  street: string;
  lat: number;
  lng: number;
};

const querySchema = z.object({
  q: z.string().trim().min(2).max(120),
});

const cache = new Map<string, { items: AddressSearchResult[]; expires: number }>();

type NominatimItem = {
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    road?: string;
    pedestrian?: string;
    neighbourhood?: string;
    suburb?: string;
    house_number?: string;
  };
};

export async function GET(request: Request) {
  try {
    assertSameOrigin(request);
    const url = new URL(request.url);
    const { q } = querySchema.parse({ q: url.searchParams.get("q") ?? "" });
    const cacheKey = q.toLowerCase();
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json({ items: cached.items });
    }

    await consumeRateLimit(`search-address:${requestIp(request)}`, 60, 3600);
    await consumeRateLimit("nominatim-reverse-global", 1, 1);

    const endpoint = new URL(
      process.env.GEOCODING_SEARCH_URL || "https://nominatim.openstreetmap.org/search",
    );
    endpoint.searchParams.set("format", "jsonv2");
    endpoint.searchParams.set("addressdetails", "1");
    endpoint.searchParams.set("countrycodes", "tj");
    endpoint.searchParams.set("limit", "5");
    endpoint.searchParams.set("accept-language", "ru");
    endpoint.searchParams.set("q", q);

    const response = await fetch(endpoint, {
      headers: {
        "User-Agent": "StroySnab/1.0 (https://www.stroysnab.tj)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) throw new Error("geocoding_unavailable");
    const rows = (await response.json()) as NominatimItem[];
    const items: AddressSearchResult[] = rows
      .map((row) => {
        const lat = Number(row.lat);
        const lng = Number(row.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        const address = row.address ?? {};
        const city = String(
          address.city || address.town || address.village || address.county || "",
        ).slice(0, 100);
        const street = [
          address.road || address.pedestrian || address.neighbourhood || address.suburb,
          address.house_number,
        ]
          .filter(Boolean)
          .join(", ")
          .slice(0, 500);
        const label = String(row.display_name || [city, street].filter(Boolean).join(", ")).slice(
          0,
          200,
        );
        return { label, city, street, lat, lng };
      })
      .filter((item): item is AddressSearchResult => Boolean(item));

    if (cache.size >= 500) cache.delete(cache.keys().next().value!);
    cache.set(cacheKey, { items, expires: Date.now() + 86400000 });
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof ApiError || error instanceof z.ZodError) return errorResponse(error);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}

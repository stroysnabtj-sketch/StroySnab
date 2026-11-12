import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin } from "@/server/security";
import { consumeRateLimit } from "@/server/rate-limit";
import { requestIp } from "@/server/request";
import { ApiError, errorResponse } from "@/server/api-error";

const coordinates = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});
const cache = new Map<string, { city: string; street: string; expires: number }>();

export async function GET(request: Request) {
  try {
    assertSameOrigin(request);
    const url = new URL(request.url);
    if (!url.searchParams.has("lat") || !url.searchParams.has("lng"))
      throw new ApiError(400, "coordinates_required", "Выберите точку на карте");
    const { lat, lng } = coordinates.parse(Object.fromEntries(url.searchParams));
    const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now())
      return NextResponse.json({ city: cached.city, street: cached.street });
    await consumeRateLimit(`reverse-address:${requestIp(request)}`, 60, 3600);
    // The database counter enforces the provider's shared budget across replicas.
    await consumeRateLimit("nominatim-reverse-global", 1, 1);
    const endpoint = new URL(
      process.env.GEOCODING_REVERSE_URL || "https://nominatim.openstreetmap.org/reverse",
    );
    endpoint.searchParams.set("format", "jsonv2");
    endpoint.searchParams.set("lat", lat.toFixed(5));
    endpoint.searchParams.set("lon", lng.toFixed(5));
    endpoint.searchParams.set("accept-language", "ru");
    const response = await fetch(endpoint, {
      headers: {
        "User-Agent": "StroySnab/1.0 (https://www.stroysnab.tj)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) throw new Error("geocoding_unavailable");
    const data = await response.json();
    const address = data.address ?? {};
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
    if (!city && !street) throw new Error("address_not_found");
    if (cache.size >= 500) cache.delete(cache.keys().next().value!);
    cache.set(key, { city, street, expires: Date.now() + 86400000 });
    return NextResponse.json({ city, street });
  } catch (error) {
    if (error instanceof ApiError || error instanceof z.ZodError) return errorResponse(error);
    return NextResponse.json(
      { error: { message: "Не удалось определить адрес" } },
      { status: 503 },
    );
  }
}

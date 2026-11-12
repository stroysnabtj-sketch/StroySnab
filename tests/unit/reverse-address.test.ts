import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/public/address/reverse/route";
import { consumeRateLimit } from "@/server/rate-limit";
import { ApiError } from "@/server/api-error";
vi.mock("@/server/rate-limit", () => ({ consumeRateLimit: vi.fn() }));
const request = (query: string, headers?: HeadersInit) =>
  new Request(`http://localhost:3000/api/public/address/reverse?${query}`, { headers });
describe("reverse address lookup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(consumeRateLimit).mockResolvedValue();
  });
  it("rejects missing, invalid and cross-site coordinates before calling the provider", async () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    expect((await GET(request(""))).status).toBe(400);
    expect((await GET(request("lat=91&lng=68"))).status).toBe(400);
    expect((await GET(request("lat=38&lng=68", { "sec-fetch-site": "cross-site" }))).status).toBe(
      403,
    );
    expect(fetch).not.toHaveBeenCalled();
    fetch.mockRestore();
  });
  it("maps address fields and caches repeated lookups without spending the shared budget", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({ address: { city: "Душанбе", road: "Рудаки", house_number: "10" } }),
        ),
      );
    const query = "lat=38.5598&lng=68.787";
    expect(await (await GET(request(query))).json()).toEqual({
      city: "Душанбе",
      street: "Рудаки, 10",
    });
    expect((await GET(request(query))).status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(consumeRateLimit).toHaveBeenCalledWith("nominatim-reverse-global", 1, 1);
    expect(new URL(String(fetch.mock.calls[0][0])).hostname).toBe("nominatim.openstreetmap.org");
    fetch.mockRestore();
  });
  it("does not call the provider when the application budget is exhausted", async () => {
    vi.mocked(consumeRateLimit).mockRejectedValue(
      new ApiError(429, "rate_limited", "Попробуйте позже"),
    );
    const fetch = vi.spyOn(globalThis, "fetch");
    expect((await GET(request("lat=38.5&lng=68.7"))).status).toBe(429);
    expect(fetch).not.toHaveBeenCalled();
    fetch.mockRestore();
  });
  it("returns a recoverable error when no street or city is available", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ address: {} })));
    expect((await GET(request("lat=38.6&lng=68.8"))).status).toBe(503);
    fetch.mockRestore();
  });
});


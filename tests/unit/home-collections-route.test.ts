import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/server/api-error";
import { requireUser } from "@/modules/auth/session";
import { GET, PUT } from "@/app/api/admin/home-collections/route";

vi.mock("@/modules/auth/session", () => ({ requireUser: vi.fn() }));

describe("home collection endpoint authorization", () => {
  it("requires catalog management permission for reads and writes", async () => {
    vi.mocked(requireUser).mockRejectedValue(new ApiError(403, "forbidden", "Недостаточно прав"));
    expect(
      (await GET(new Request("http://localhost:3000/api/admin/home-collections"))).status,
    ).toBe(403);
    expect(requireUser).toHaveBeenLastCalledWith("catalog:manage");
    expect(
      (
        await PUT(
          new Request("http://localhost:3000/api/admin/home-collections", {
            method: "PUT",
            body: "{}",
          }),
        )
      ).status,
    ).toBe(403);
    expect(requireUser).toHaveBeenLastCalledWith("catalog:manage");
  });
  it("rejects cross-origin mutations before attempting to write", async () => {
    vi.mocked(requireUser).mockClear();
    const response = await PUT(
      new Request("http://localhost:3000/api/admin/home-collections", {
        method: "PUT",
        headers: { origin: "https://untrusted.example" },
        body: "{}",
      }),
    );
    expect(response.status).toBe(403);
    expect(requireUser).not.toHaveBeenCalled();
  });
});

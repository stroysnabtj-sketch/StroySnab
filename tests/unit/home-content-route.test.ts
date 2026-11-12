import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/server/api-error";
import { requireUser } from "@/modules/auth/session";
import { GET, PUT } from "@/app/api/admin/home-content/route";
vi.mock("@/modules/auth/session", () => ({ requireUser: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
describe("homepage editor API security", () => {
  it("rejects anonymous and unauthorized reads and writes", async () => {
    vi.mocked(requireUser).mockRejectedValue(new ApiError(403, "forbidden", "Недостаточно прав"));
    expect((await GET()).status).toBe(403);
    expect(
      (
        await PUT(
          new Request("http://localhost:3000/api/admin/home-content", {
            method: "PUT",
            body: "{}",
          }),
        )
      ).status,
    ).toBe(403);
    expect(requireUser).toHaveBeenLastCalledWith("catalog:manage");
  });
  it("rejects cross-site mutations before authentication or storage access", async () => {
    vi.mocked(requireUser).mockClear();
    const result = await PUT(
      new Request("http://localhost:3000/api/admin/home-content", {
        method: "PUT",
        headers: { origin: "https://evil.test", "sec-fetch-site": "cross-site" },
        body: "{}",
      }),
    );
    expect(result.status).toBe(403);
    expect(requireUser).not.toHaveBeenCalled();
  });
});

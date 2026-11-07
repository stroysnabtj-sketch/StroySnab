import { expect, it } from "vitest";
import { boundedJson } from "@/server/bounded-json";
it("bounds actual bytes without content-length", async () => {
  const request = new Request("http://localhost", {
    method: "POST",
    body: new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode("x".repeat(5000)));
        c.close();
      },
    }),
    duplex: "half",
  } as RequestInit);
  await expect(boundedJson(request)).rejects.toMatchObject({ status: 413 });
});
it("parses bounded valid JSON", async () => {
  expect(
    await boundedJson(
      new Request("http://localhost", { method: "POST", body: '{"code":"000123"}' }),
    ),
  ).toEqual({ code: "000123" });
});

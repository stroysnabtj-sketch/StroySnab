import { afterEach, expect, it, vi } from "vitest";
import { createDeepSeekDocumentProvider } from "@/modules/procurement/deepseek";
afterEach(() => vi.unstubAllGlobals());
it("uploads with expiry, validates JSON and removes only its temporary provider file", async () => {
  const calls: Array<{ url: string; options: RequestInit }> = [];
  vi.stubGlobal("fetch", async (url: string, options: RequestInit) => {
    calls.push({ url: String(url), options });
    if (options.method === "DELETE") return Response.json({ deleted: true });
    if (String(url).endsWith("/files")) return Response.json({ id: "file-api-owned" });
    return Response.json({
      choices: [
        {
          finish_reason: "stop",
          message: {
            content: JSON.stringify({
              lines: [
                { name: "Цемент М500", qty: "2", unit: "мешок" },
                { name: "Арматура 12 мм", qty: null, unit: null },
              ],
              warnings: [],
            }),
          },
        },
      ],
    });
  });
  const result = await createDeepSeekDocumentProvider("test-key").extract({
    bytes: Buffer.from("x"),
    mime: "application/pdf",
    filename: "private-name.pdf",
  });
  expect(result.lines[1]).toEqual({ name: "Арматура 12 мм", qty: "", unit: "" });
  const form = calls[0].options.body as FormData;
  expect([...form.keys()][0]).toBe("purpose");
  expect(form.get("expires_after[seconds]")).toBe("3600");
  expect((form.get("file") as File).name).toBe("materials.pdf");
  expect(calls.at(-1)!.options.method).toBe("DELETE");
  expect(calls[1].options.body).not.toContain("private-name");
});
it("rejects invented fields, malformed or truncated extraction and still cleans up", async () => {
  const send = vi.fn(async (url: string, options: RequestInit) => {
    if (options.method === "DELETE") return Response.json({ deleted: true });
    if (url.endsWith("/files")) return Response.json({ id: "file-api-owned" });
    return Response.json({ choices: [{ finish_reason: "length", message: { content: "{}" } }] });
  });
  vi.stubGlobal("fetch", send);
  await expect(
    createDeepSeekDocumentProvider("test-key").extract({
      bytes: Buffer.from("x"),
      mime: "application/pdf",
      filename: "x.pdf",
    }),
  ).rejects.toThrow();
  expect(send.mock.calls.at(-1)![1].method).toBe("DELETE");
});

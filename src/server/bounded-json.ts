import { ApiError } from "./api-error";
export async function boundedJson(request: Request, maxBytes = 4096): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > maxBytes)
    throw new ApiError(413, "too_large", "Запрос слишком большой");
  const reader = request.body?.getReader();
  if (!reader) return {};
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > maxBytes) {
        void reader.cancel().catch(() => {});
        throw new ApiError(413, "too_large", "Запрос слишком большой");
      }
      chunks.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = Buffer.concat(chunks);
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return text.trim() ? JSON.parse(text) : {};
  } catch {
    throw new ApiError(400, "invalid_json", "Некорректный запрос");
  }
}

import { ApiError } from "./api-error";

export async function boundedForm(request: Request, maxBytes = 11 * 1024 * 1024) {
  if (Number(request.headers.get("content-length")) > maxBytes)
    throw new ApiError(413, "too_large", "Файл слишком большой");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "empty_body", "Выберите файл");
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let size = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > maxBytes) {
        void reader.cancel().catch(() => {});
        throw new ApiError(413, "too_large", "Файл слишком большой");
      }
      chunks.push(new Uint8Array(next.value));
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return await new Response(new Blob(chunks), {
      headers: { "Content-Type": request.headers.get("content-type") ?? "" },
    }).formData();
  } catch {
    throw new ApiError(400, "invalid_form", "Некорректная форма загрузки");
  }
}

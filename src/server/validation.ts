import { ApiError } from "./api-error";
import { checkPayloadSize } from "./security";

export async function parseJsonBody<T = unknown>(request: Request, maxBytes = 1024 * 1024): Promise<T> {
  checkPayloadSize(request, maxBytes);
  const text = await request.text();
  if (!text || text.trim() === "") {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(400, "validation_failed", "Некорректный формат JSON", {
      body: "invalid_json",
    });
  }
}


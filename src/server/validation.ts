import { ApiError } from "./api-error";
import { boundedJson } from "./bounded-json";

export async function parseJsonBody<T = unknown>(request: Request, maxBytes = 1024 * 1024): Promise<T> {
  try {
    return (await boundedJson(request, maxBytes)) as T;
  } catch (error) {
    if (!(error instanceof ApiError) || error.code !== "invalid_json") throw error;
    throw new ApiError(400, "validation_failed", "Некорректный формат JSON", {
      body: "invalid_json",
    });
  }
}


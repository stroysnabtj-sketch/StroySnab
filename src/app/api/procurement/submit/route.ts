import { requireCustomer } from "@/modules/auth/session";
import { submitProcurementRequest } from "@/modules/procurement/submit";
import { assertSameOrigin } from "@/server/security";
import { consumeRateLimit } from "@/server/rate-limit";
import { requestIp } from "@/server/request";
import { ApiError, errorResponse } from "@/server/api-error";
import { jsonResponse } from "@/server/json";
import { boundedForm } from "@/server/bounded-form";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireCustomer();
    await consumeRateLimit(`procurement:${requestIp(request)}`, 10, 3600);
    const form = await boundedForm(request, 51 * 1024 * 1024);
    const payload = form.get("payload");
    if (typeof payload !== "string" || payload.length > 150000)
      throw new ApiError(400, "invalid_request", "Проверьте данные заявки");
    let input: unknown;
    try {
      input = JSON.parse(payload);
    } catch {
      throw new ApiError(400, "invalid_request", "Проверьте данные заявки");
    }
    const files = form.getAll("files");
    if (files.some((file) => !(file instanceof File)))
      throw new ApiError(400, "invalid_file", "Выберите файл");
    return jsonResponse(
      await submitProcurementRequest(input, files as File[], user),
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

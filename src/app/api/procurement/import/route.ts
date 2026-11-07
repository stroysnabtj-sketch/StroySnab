import { assertSameOrigin } from "@/server/security";
import { errorResponse, ApiError } from "@/server/api-error";
import { jsonResponse } from "@/server/json";
import { importList } from "@/modules/procurement/files";
import { consumeRateLimit } from "@/server/rate-limit";
import { requestIp } from "@/server/request";
import { boundedForm } from '@/server/bounded-form';
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await consumeRateLimit(`list-import:${requestIp(request)}`, 30, 3600);
    const file = (await boundedForm(request)).get("file");
    if (!(file instanceof File)) throw new ApiError(400, "file_required", "Выберите файл");
    return jsonResponse({ lines: await importList(file) });
  } catch (e) {
    return errorResponse(e);
  }
}

import { optionalUser } from "@/modules/auth/session";
import { attachList } from "@/modules/procurement/files";
import { assertSameOrigin } from "@/server/security";
import { ApiError, errorResponse } from "@/server/api-error";
import { jsonResponse } from "@/server/json";
import { boundedForm } from '@/server/bounded-form';
import { getProcurementRequest } from '@/modules/procurement/service';
import { consumeRateLimit } from '@/server/rate-limit';
import { requestIp } from '@/server/request';
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const id=(await params).id,actor=await optionalUser(),token=request.headers.get('x-request-access');
    await getProcurementRequest(id,actor,token);
    await consumeRateLimit(`request-upload:${requestIp(request)}`,30,3600);
    const file = (await boundedForm(request)).get("file");
    if (!(file instanceof File)) throw new ApiError(400, "file_required", "Выберите файл");
    return jsonResponse(
      await attachList(
        (await params).id,
        await optionalUser(),
        request.headers.get("x-request-access"),
        file,
      ),
      { status: 201 },
    );
  } catch (e) {
    return errorResponse(e);
  }
}

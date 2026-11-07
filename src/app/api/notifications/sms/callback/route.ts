import { getDb } from "@/db";
import { applyDeliveryReceipt, readSignedDeliveryReceipt } from "@/modules/notifications/callback";
import { ApiError } from "@/server/api-error";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const receipt = await readSignedDeliveryReceipt(request);
    const matched = await applyDeliveryReceipt(await getDb(), receipt);
    return new Response(
      null,
      matched ? { status: 204 } : { status: 503, headers: { "Retry-After": "5" } },
    );
  } catch (error) {
    if (error instanceof ApiError) return new Response(null, { status: error.status });
    // Gateway data and query parameters can contain private information.
    console.error("sms_callback_failed");
    return new Response(null, { status: 500 });
  }
}

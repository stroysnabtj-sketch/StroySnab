import { NextResponse } from "next/server";
import { acceptInvitation } from "@/modules/suppliers/service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
import { consumeRateLimit } from "@/server/rate-limit";
import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const ip = requestIp(request);
    await consumeRateLimit(`supplier-invite:${ip}`, 10, 900);
    const input = await parseJsonBody(request, 4096);
    return NextResponse.json(await acceptInvitation(input, ip), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/modules/auth/session";
import { assignSupplierOwner } from "@/modules/suppliers/service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("suppliers:manage");
    const { email } = z
      .object({ email: z.string().email() })
      .parse(await parseJsonBody(request, 4096));
    return NextResponse.json(
      await assignSupplierOwner(actor, (await params).id, email, requestIp(request)),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

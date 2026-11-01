import { NextResponse } from "next/server";
import { resetPassword } from "@/modules/auth/service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
export async function POST(request: Request) {
  try { await resetPassword(await request.json(), requestIp(request)); return NextResponse.json({ ok: true }); }
  catch (error) { return errorResponse(error); }
}

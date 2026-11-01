import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { updateProfile } from "@/modules/auth/service";
import { errorResponse } from "@/server/api-error";
export async function PATCH(request: Request) {
  try { const user = await requireUser(); return NextResponse.json(await updateProfile(user.id, await request.json())); }
  catch (error) { return errorResponse(error); }
}

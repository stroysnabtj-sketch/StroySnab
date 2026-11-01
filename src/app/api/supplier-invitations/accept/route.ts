import { NextResponse } from "next/server";
import { acceptInvitation } from "@/modules/suppliers/service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
import { consumeRateLimit } from "@/server/rate-limit";
export async function POST(request: Request) { try { const ip = requestIp(request); await consumeRateLimit(`supplier-invite:${ip}`, 10, 900); return NextResponse.json(await acceptInvitation(await request.json(), ip), { status: 201 }); } catch (error) { return errorResponse(error); } }

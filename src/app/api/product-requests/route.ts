import { NextResponse } from "next/server";
import { optionalUser } from "@/modules/auth/session";
import { createProductRequest } from "@/modules/product-requests/service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
export async function POST(request: Request) { try { const result = await createProductRequest(await request.json(), await optionalUser(), requestIp(request)); return NextResponse.json(result, { status: 201 }); } catch (error) { return errorResponse(error); } }

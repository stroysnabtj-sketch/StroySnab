import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";
import { errorResponse } from "@/server/api-error";
import { LOCALE_COOKIE } from "@/i18n/locale";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { locale } = z
      .object({ locale: z.enum(["ru", "tg"]) })
      .parse(await parseJsonBody(request, 1024));
    const response = NextResponse.json({ locale }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(LOCALE_COOKIE, locale, {
      httpOnly: true,
      sameSite: "lax",
      secure: new URL(request.url).protocol === "https:",
      path: "/",
      maxAge: 31536000,
    });
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}

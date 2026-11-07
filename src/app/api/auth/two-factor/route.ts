import { NextResponse } from "next/server";
function retired() {
  return NextResponse.json(
    { error: { code: "use_contact_code", message: "Используйте вход по коду из SMS или письма" } },
    { status: 410 },
  );
}
export const GET = retired;
export const POST = retired;

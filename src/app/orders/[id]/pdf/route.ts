import { cookies } from "next/headers";
import { optionalUser } from "@/modules/auth/session";
import { orderPdf } from "@/modules/orders/pdf";
import { errorResponse } from "@/server/api-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pdf = await orderPdf(
      id,
      await optionalUser(),
      (await cookies()).get(`kh_order_${id}`)?.value ?? null,
    );
    const filename = `invoice-${pdf.number.replace(/[^A-Za-z0-9_-]/g, "_")}.pdf`;
    return new Response(new Uint8Array(pdf.bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(`Накладная-${pdf.number}.pdf`)}`,
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}

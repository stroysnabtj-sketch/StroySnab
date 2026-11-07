import { optionalUser } from "@/modules/auth/session";
import { quotationPdf } from "@/modules/procurement/pdf";
import { errorResponse } from "@/server/api-error";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const pdf = await quotationPdf(
      (await params).id,
      await optionalUser(),
      new URL(request.url).searchParams.get("access"),
    );
    return new Response(new Uint8Array(pdf.bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdf.number}.pdf"`,
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}

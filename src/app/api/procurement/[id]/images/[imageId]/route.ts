import { optionalUser } from "@/modules/auth/session";
import { readQuotationImage } from "@/modules/procurement/images";
import { errorResponse } from "@/server/api-error";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> },
) {
  try {
    const { id, imageId } = await params;
    const image = await readQuotationImage(
      id,
      imageId,
      await optionalUser(),
      new URL(request.url).searchParams.get("access"),
    );
    return new Response(new Uint8Array(image.bytes), {
      headers: {
        "Content-Type": image.mime,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}

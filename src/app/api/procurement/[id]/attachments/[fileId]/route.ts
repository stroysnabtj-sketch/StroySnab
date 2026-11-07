import { optionalUser } from "@/modules/auth/session";
import { readList } from "@/modules/procurement/files";
import { errorResponse } from "@/server/api-error";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> },
) {
  try {
    const { id, fileId } = await params;
    const file = await readList(
      id,
      fileId,
      await optionalUser(),
      new URL(request.url).searchParams.get("access"),
    );
    return new Response(new Uint8Array(file.bytes), {
      headers: {
        "Content-Type": file.mime,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}

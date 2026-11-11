import { optionalUser } from "@/modules/auth/session";
import { readProductFile } from "@/modules/catalog/image-service";
import { errorResponse } from "@/server/api-error";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const preview = new URL(request.url).searchParams.get("preview") === "1";
    const actor = preview ? await optionalUser() : undefined;
    const file =
      preview && !actor ? null : await readProductFile((await params).id, actor ?? undefined);
    if (!file)
      return new Response("Not found", {
        status: 404,
        headers: { "Cache-Control": "private, no-store" },
      });
    return new Response(new Uint8Array(file.data), {
      headers: {
        "Content-Type": file.mime,
        "Content-Length": String(file.data.length),
        "Cache-Control": preview ? "private, no-store" : "public, max-age=60, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

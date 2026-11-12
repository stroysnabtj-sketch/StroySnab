import { optionalUser } from "@/modules/auth/session";
import { readHomeImage } from "@/modules/merchandising/home-images";
import { errorResponse } from "@/server/api-error";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const file = await readHomeImage((await params).id, await optionalUser());
    if (!file)
      return new Response("Not found", {
        status: 404,
        headers: { "Cache-Control": "private, no-store" },
      });
    return new Response(new Uint8Array(file.data), {
      headers: {
        "Content-Type": file.mime,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

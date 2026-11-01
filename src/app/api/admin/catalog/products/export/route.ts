import { requireUser } from "@/modules/auth/session";
import { exportProducts } from "@/modules/catalog/import-export";
import { errorResponse } from "@/server/api-error";
export async function GET(request: Request) { try { await requireUser("catalog:manage"); const format = new URL(request.url).searchParams.get("format") === "xlsx" ? "xlsx" : "csv"; const result = await exportProducts(format, new URL(request.url).searchParams.get("template") === "1"); return new Response(new Uint8Array(result.data), { headers: { "Content-Type": result.mime, "Content-Disposition": `attachment; filename="stroyhub-products.${result.extension}"` } }); } catch (error) { return errorResponse(error); } }

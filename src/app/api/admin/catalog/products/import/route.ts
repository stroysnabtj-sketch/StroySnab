import { assertSameOrigin } from "@/server/security";
import { NextResponse } from "next/server";
import { requireUser } from "@/modules/auth/session";
import { createProduct, updateProduct } from "@/modules/catalog/admin-service";
import { parseProductFile, validateImportRows } from "@/modules/catalog/import-export";
import { boundedForm } from "@/server/bounded-form";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("catalog:manage");
    const form = await boundedForm(request, 21 * 1024 * 1024);
    const file = form.get("file");
    if (!(file instanceof File))
      return NextResponse.json(
        { error: { code: "validation_failed", message: "Выберите CSV или XLSX" } },
        { status: 400 },
      );
    const rows = await validateImportRows(await parseProductFile(file));
    const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";
    let imported = 0;
    if (!dryRun)
      for (const row of rows.filter((item) => item.valid && item.data)) {
        if (row.id) await updateProduct(actor, row.id, row.data, requestIp(request));
        else await createProduct(actor, row.data, requestIp(request));
        imported++;
      }
    return NextResponse.json({
      total: rows.length,
      valid: rows.filter((row) => row.valid).length,
      imported,
      rows: rows.filter((row) => !row.valid).slice(0, 100),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

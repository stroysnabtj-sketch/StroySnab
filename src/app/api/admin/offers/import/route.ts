import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/modules/auth/session";
import { parseProductFile } from "@/modules/catalog/import-export";
import { bulkUpdateOffers } from "@/modules/suppliers/offer-service";
import { errorResponse } from "@/server/api-error";
import { requestIp } from "@/server/request";
export async function POST(request: Request) { try { const actor = await requireUser("suppliers:manage"); const form = await request.formData(); const file = form.get("file"); if (!(file instanceof File)) return NextResponse.json({ error: { code: "validation_failed", message: "Выберите CSV-файл" } }, { status: 400 }); const supplierId = z.string().uuid().parse(form.get("supplierId")); return NextResponse.json(await bulkUpdateOffers(actor, supplierId, await parseProductFile(file), requestIp(request))); } catch (error) { return errorResponse(error); } }

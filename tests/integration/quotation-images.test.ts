import { expect, it } from "vitest";
import sharp from "sharp";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users, quotations } from "@/db/schema";
import { quotationPdf } from "@/modules/procurement/pdf";
import type { SessionUser } from "@/modules/auth/session";
import {
  createProcurementRequest,
  saveQuotation,
  updateProcurementStatus,
} from "@/modules/procurement/service";
import { uploadQuotationImage, readQuotationImage } from "@/modules/procurement/images";
it("keeps quote photos private until published and verifies file and request ownership", async () => {
  const db = await getDb(),
    [admin] = await db.select().from(users).where(eq(users.role, "SUPER_ADMIN"));
  const actor = admin as SessionUser;
  const request = await createProcurementRequest(
    {
      title: "Фото КП",
      contactName: "Покупатель",
      contactPhone: "+992931234567",
      lines: [{ name: "Материал", qty: "1", unit: "шт." }],
    },
    null,
  );
  const png = await sharp({ create: { width: 40, height: 40, channels: 3, background: "red" } })
    .png()
    .toBuffer();
  await expect(
    uploadQuotationImage(request.id, { ...actor, role: "CUSTOMER" }, new File([png], "a.png")),
  ).rejects.toMatchObject({ status: 403 });
  await expect(
    uploadQuotationImage(request.id, actor, new File(["<svg/>"], "a.jpg")),
  ).rejects.toThrow();
  const image = await uploadQuotationImage(request.id, actor, new File([png], "a.png"));
  await expect(
    readQuotationImage(request.id, image.id, null, request.accessToken!),
  ).rejects.toMatchObject({ status: 404 });
  const data = {
    version: 0,
    send: false,
    validUntil: new Date(Date.now() + 86400000).toISOString(),
    lines: [
      {
        id: crypto.randomUUID(),
        name: "Материал",
        qty: "1",
        unit: "шт.",
        basePriceDirams: "10000",
        imageIds: [image.id],
      },
    ],
  };
  await saveQuotation(request.id, actor, data);
  await expect(
    readQuotationImage(request.id, image.id, null, request.accessToken!),
  ).rejects.toMatchObject({ status: 404 });
  await updateProcurementStatus(request.id, actor, {
    status: "REJECTED",
    reason: "Отменена подготовка",
  });
  await expect(
    readQuotationImage(request.id, image.id, null, request.accessToken!),
  ).rejects.toMatchObject({ status: 404 });
  await db
    .update(quotations)
    .set({ status: "DECLINED" })
    .where(eq(quotations.requestId, request.id));
  await expect(
    readQuotationImage(request.id, image.id, null, request.accessToken!),
  ).rejects.toMatchObject({ status: 404 });
  await saveQuotation(request.id, actor, { ...data, version: 1, send: true });
  const pdf = await quotationPdf(request.id, null, request.accessToken!);
  expect(pdf.bytes.includes(Buffer.from("/Subtype /Image"))).toBe(true);
  expect((await readQuotationImage(request.id, image.id, null, request.accessToken!)).mime).toBe(
    "image/webp",
  );
  await expect(readQuotationImage(request.id, image.id, null, "wrong")).rejects.toThrow();
  const other = await createProcurementRequest(
    {
      title: "Другая",
      contactName: "Покупатель",
      contactPhone: "+992931234567",
      lines: [{ name: "Материал", qty: "1", unit: "шт." }],
    },
    null,
  );
  await expect(saveQuotation(other.id, actor, data)).rejects.toMatchObject({ status: 400 });
});

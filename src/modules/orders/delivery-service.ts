import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { writeAudit } from "@/modules/audit/service";
import { hasPermission, type Role } from "@/modules/rbac/permissions";
import { normalizePhone } from "@/modules/system/phone";
import { ApiError } from "@/server/api-error";
const assignmentSchema = z.object({
  driverName: z.string().trim().min(2).max(120),
  driverPhone: z.string().trim().min(8).max(30),
  vehiclePlate: z.string().trim().min(3).max(30),
  expectedUpdatedAt: z.string().datetime(),
});
export async function assignOrderDelivery(
  actor: { id: string; role: Role },
  id: string,
  input: unknown,
) {
  if (!hasPermission(actor.role, "deliveries:assign"))
    throw new ApiError(403, "forbidden", "Нет права назначать водителя");
  if (!z.string().uuid().safeParse(id).success)
    throw new ApiError(404, "not_found", "Заказ не найден");
  const data = assignmentSchema.parse(input),
    phone = normalizePhone(data.driverPhone);
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(orders).where(eq(orders.id, id)).for("update");
    if (!before) throw new ApiError(404, "not_found", "Заказ не найден");
    if (before.vehicleType === "PICKUP")
      throw new ApiError(400, "pickup_order", "Для самовывоза водитель не назначается");
    if (!["CONFIRMED", "DISPATCHED"].includes(before.status))
      throw new ApiError(
        409,
        "delivery_status",
        "Назначение доступно после подтверждения заказа и до завершения доставки",
      );
    if (before.updatedAt.toISOString() !== data.expectedUpdatedAt)
      throw new ApiError(
        409,
        "order_changed",
        "Заказ уже изменён. Обновите страницу перед назначением",
      );
    const updatedAt = new Date(Math.max(Date.now(), before.updatedAt.getTime() + 1));
    await tx
      .update(orders)
      .set({
        driverName: data.driverName,
        driverPhone: phone,
        vehiclePlate: data.vehiclePlate,
        updatedAt,
      })
      .where(eq(orders.id, id));
    await writeAudit(tx, {
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "orders.delivery_assigned",
      entity: "orders",
      entityId: id,
      data: { driverName: data.driverName, vehiclePlate: data.vehiclePlate },
    });
    return { id, updatedAt: updatedAt.toISOString() };
  });
}

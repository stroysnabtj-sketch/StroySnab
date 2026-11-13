import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { auditLog } from "@/db/schema";
import { notificationOutbox } from "@/db/schema/notifications";
import { requireUser } from "@/modules/auth/session";
import { retryNotification } from "@/modules/notifications/worker";
import { ApiError, errorResponse } from "@/server/api-error";
import { jsonResponse } from "@/server/json";
import { assertSameOrigin } from "@/server/security";
import { parseJsonBody } from "@/server/validation";

export async function GET(request: Request) {
  try {
    await requireUser("orders:manage");
    const state = z
      .enum(["queued", "accepted", "delivered", "failed"])
      .optional()
      .parse(new URL(request.url).searchParams.get("state") ?? undefined);
    const rows = await (
      await getDb()
    )
      .select({
        id: notificationOutbox.id,
        event: notificationOutbox.event,
        channel: notificationOutbox.channel,
        entityId: notificationOutbox.entityId,
        state: notificationOutbox.state,
        recipient: notificationOutbox.recipient,
        attemptCount: notificationOutbox.attemptCount,
        lastError: notificationOutbox.lastError,
        createdAt: notificationOutbox.createdAt,
        acceptedAt: notificationOutbox.acceptedAt,
        deliveredAt: notificationOutbox.deliveredAt,
      })
      .from(notificationOutbox)
      .where(state ? eq(notificationOutbox.state, state) : undefined)
      .orderBy(desc(notificationOutbox.createdAt))
      .limit(100);
    return jsonResponse({
      notifications: rows.map((row) => ({
        ...row,
        recipient: `${row.recipient.slice(0, 4)}•••••${row.recipient.slice(-3)}`,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("orders:manage");
    const { id } = z.object({ id: z.uuid() }).parse(await parseJsonBody(request));
    const db = await getDb();
    const result = await db.transaction(async (tx) => {
      const retried = await retryNotification(tx, id);
      if (!retried)
        throw new ApiError(
          409,
          "notification_not_failed",
          "Повтор доступен только для сообщений с ошибкой",
        );
      await tx.insert(auditLog).values({
        actorUserId: actor.id,
        actorRole: actor.role,
        action: "notification.retry",
        entity: "notification",
        entityId: id,
      });
      return retried;
    });
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

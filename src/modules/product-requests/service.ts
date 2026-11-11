import { createHash } from "node:crypto";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { auditLog, productRequests, products, users } from "@/db/schema";
import type { SessionUser } from "@/modules/auth/session";
import { writeAudit } from "@/modules/audit/service";
import { hasPermission, type Role } from "@/modules/rbac/permissions";
import { nextDocNumber } from "@/modules/system/doc-number";
import { normalizePhone } from "@/modules/system/phone";
import { ApiError } from "@/server/api-error";
import { consumeRateLimit } from "@/server/rate-limit";
import {
  findRecentRequestByFingerprint,
  recordIdempotencyKey,
  withIdempotencyLock,
  type ProductRequestResult,
} from "./idempotency";
import {
  customerCancelSchema,
  makeProductRequestSchema,
  respondProductRequestSchema,
} from "./schemas";
import {
  assertValidCustomerCancel,
  assertValidManagerTransition,
} from "./status";
import type {
  CustomerProductRequestDTO,
  ListManagedRequestsQuery,
  ListManagedRequestsResponse,
  ListOwnRequestsQuery,
  ListOwnRequestsResponse,
  ManagedProductRequestDetailDTO,
  ProductRequestDTO,
  ProductRequestStatus,
} from "./types";

export async function createProductRequest(
  input: unknown,
  user: SessionUser | null,
  ip: string
): Promise<ProductRequestResult> {
  const schema = makeProductRequestSchema(new Date());
  const data = schema.parse(input);

  // Honeypot check
  if (data.website && data.website.trim() !== "") {
    return { id: null, number: "PRQ-0000", status: "NEW", createdAt: new Date() };
  }

  // Normalize phone
  const phone = normalizePhone(data.contactPhone);

  // Build owner-aware fingerprint for deduplication
  const ownerContext = user?.role === "CUSTOMER" ? `user:${user.id}` : `ip:${ip}`;
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        owner: ownerContext,
        productName: data.productName,
        description: data.description,
        quantity: data.quantity,
        unit: data.unit,
        requiredDate: data.requiredDate,
        contactName: data.contactName,
        phone,
        email: data.contactEmail,
      })
    )
    .digest("hex");

  // Idempotency lock prevents concurrent race conditions
  return await withIdempotencyLock(fingerprint, async () => {
    // Check if an identical request was already created within the last 30 seconds
    const duplicate = await findRecentRequestByFingerprint(fingerprint, 30000);
    if (duplicate) {
      return duplicate;
    }

    // Rate limit: 10 non-duplicate requests per hour per IP
    await consumeRateLimit(`product-request:${ip}`, 10, 3600);

    const db = await getDb();
    const created = await db.transaction(async (tx) => {
      const number = await nextDocNumber(tx, "PRQ");
      const [record] = await tx
        .insert(productRequests)
        .values({
          number,
          userId: user?.role === "CUSTOMER" ? user.id : null,
          productName: data.productName,
          description: data.description,
          quantity: data.quantity,
          unit: data.unit,
          requiredDate: data.requiredDate,
          contactName: data.contactName,
          contactPhone: phone,
          contactEmail: data.contactEmail,
          fingerprint,
        })
        .returning({
          id: productRequests.id,
          number: productRequests.number,
          status: productRequests.status,
          createdAt: productRequests.createdAt,
        });

      await writeAudit(tx, {
        actorUserId: user?.id,
        actorRole: user?.role ?? "GUEST",
        action: "product_request.created",
        entity: "product_requests",
        entityId: record.id,
        data: { number },
        ip,
      });

      return record;
    });

    try {
      await recordIdempotencyKey(fingerprint, created.id);
    } catch {
      // Non-critical key recording error
    }

    return created;
  });
}

function serializeProductRequest(
  row: typeof productRequests.$inferSelect,
  assigneeName?: string | null,
  productTitle?: string | null
): ProductRequestDTO {
  return {
    id: row.id,
    number: row.number,
    userId: row.userId,
    productName: row.productName,
    description: row.description,
    quantity: row.quantity,
    unit: row.unit,
    requiredDate: row.requiredDate,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    contactEmail: row.contactEmail,
    status: row.status as ProductRequestStatus,
    assignedTo: row.assignedTo,
    assignedToName: assigneeName ?? null,
    responseNote: row.responseNote,
    estimatedPriceDirams: row.estimatedPriceDirams !== null ? row.estimatedPriceDirams.toString() : null,
    estimatedDeliveryDays: row.estimatedDeliveryDays,
    resolvedProductId: row.resolvedProductId,
    resolvedProductTitle: productTitle ?? null,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listManagedRequests(
  actor: SessionUser,
  query: ListManagedRequestsQuery = {}
): Promise<ListManagedRequestsResponse> {
  if (!hasPermission(actor.role, "product_requests:manage")) {
    throw new ApiError(403, "forbidden", "Недостаточно прав для управления заявками");
  }

  const db = await getDb();
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 25));
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (query.status && query.status.trim() !== "") {
    conditions.push(eq(productRequests.status, query.status.trim()));
  }

  if (query.q && query.q.trim() !== "") {
    const term = `%${query.q.trim()}%`;
    conditions.push(
      or(
        ilike(productRequests.number, term),
        ilike(productRequests.productName, term),
        ilike(productRequests.contactName, term),
        ilike(productRequests.contactPhone, term),
        ilike(productRequests.contactEmail, term)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Sorting: Default rule - NEW first, then oldest first; or created_desc / created_asc
  let orderByClause;
  if (query.sort === "created_desc") {
    orderByClause = [desc(productRequests.createdAt)];
  } else if (query.sort === "created_asc") {
    orderByClause = [asc(productRequests.createdAt)];
  } else {
    // Default per spec: NEW first, then created_at ASC (oldest first so they don't get lost)
    orderByClause = [
      sql`CASE WHEN ${productRequests.status} = 'NEW' THEN 0 ELSE 1 END ASC`,
      asc(productRequests.createdAt),
    ];
  }

  const [totalRow] = await db
    .select({ count: count() })
    .from(productRequests)
    .where(whereClause);
  const total = Number(totalRow?.count ?? 0);

  const [newCountRow] = await db
    .select({ count: count() })
    .from(productRequests)
    .where(eq(productRequests.status, "NEW"));
  const newCount = Number(newCountRow?.count ?? 0);

  const rows = await db
    .select({
      id: productRequests.id,
      number: productRequests.number,
      userId: productRequests.userId,
      productName: productRequests.productName,
      description: productRequests.description,
      quantity: productRequests.quantity,
      unit: productRequests.unit,
      requiredDate: productRequests.requiredDate,
      contactName: productRequests.contactName,
      contactPhone: productRequests.contactPhone,
      contactEmail: productRequests.contactEmail,
      status: productRequests.status,
      assignedTo: productRequests.assignedTo,
      responseNote: productRequests.responseNote,
      estimatedPriceDirams: productRequests.estimatedPriceDirams,
      estimatedDeliveryDays: productRequests.estimatedDeliveryDays,
      resolvedProductId: productRequests.resolvedProductId,
      version: productRequests.version,
      createdAt: productRequests.createdAt,
      updatedAt: productRequests.updatedAt,
      assigneePhone: users.phone,
      productTitle: products.nameRu,
    })
    .from(productRequests)
    .leftJoin(users, eq(productRequests.assignedTo, users.id))
    .leftJoin(products, eq(productRequests.resolvedProductId, products.id))
    .where(whereClause)
    .orderBy(...orderByClause)
    .limit(pageSize)
    .offset(offset);

  const items = rows.map((r) =>
    serializeProductRequest(
      {
        id: r.id,
        number: r.number,
        userId: r.userId,
        productName: r.productName,
        description: r.description,
        quantity: r.quantity,
        unit: r.unit,
        requiredDate: r.requiredDate,
        contactName: r.contactName,
        contactPhone: r.contactPhone,
        contactEmail: r.contactEmail,
        status: r.status,
        assignedTo: r.assignedTo,
        responseNote: r.responseNote,
        estimatedPriceDirams: r.estimatedPriceDirams,
        estimatedDeliveryDays: r.estimatedDeliveryDays,
        resolvedProductId: r.resolvedProductId,
        version: r.version,
        fingerprint: null,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      },
      r.assigneePhone,
      r.productTitle
    )
  );

  return { items, total, page, pageSize, newCount };
}

export async function getManagedRequest(
  actor: SessionUser,
  id: string
): Promise<ManagedProductRequestDetailDTO> {
  if (!hasPermission(actor.role, "product_requests:manage")) {
    throw new ApiError(403, "forbidden", "Недостаточно прав для просмотра заявки");
  }
  if (!z.uuid().safeParse(id).success)
    throw new ApiError(404, "not_found", "Заявка не найдена");

  const db = await getDb();
  const [row] = await db
    .select({
      id: productRequests.id,
      number: productRequests.number,
      userId: productRequests.userId,
      productName: productRequests.productName,
      description: productRequests.description,
      quantity: productRequests.quantity,
      unit: productRequests.unit,
      requiredDate: productRequests.requiredDate,
      contactName: productRequests.contactName,
      contactPhone: productRequests.contactPhone,
      contactEmail: productRequests.contactEmail,
      status: productRequests.status,
      assignedTo: productRequests.assignedTo,
      responseNote: productRequests.responseNote,
      estimatedPriceDirams: productRequests.estimatedPriceDirams,
      estimatedDeliveryDays: productRequests.estimatedDeliveryDays,
      resolvedProductId: productRequests.resolvedProductId,
      version: productRequests.version,
      createdAt: productRequests.createdAt,
      updatedAt: productRequests.updatedAt,
      assigneePhone: users.phone,
      productTitle: products.nameRu,
    })
    .from(productRequests)
    .leftJoin(users, eq(productRequests.assignedTo, users.id))
    .leftJoin(products, eq(productRequests.resolvedProductId, products.id))
    .where(eq(productRequests.id, id))
    .limit(1);

  if (!row) {
    throw new ApiError(404, "not_found", "Заявка не найдена");
  }

  const historyRows = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      actorRole: auditLog.actorRole,
      actorUserId: auditLog.actorUserId,
      createdAt: auditLog.createdAt,
      data: auditLog.data,
    })
    .from(auditLog)
    .where(
      and(
        eq(auditLog.entity, "product_requests"),
        eq(auditLog.entityId, id)
      )
    )
    .orderBy(desc(auditLog.createdAt));

  const history = historyRows.map((h) => ({
    id: h.id,
    action: h.action,
    actorRole: h.actorRole,
    actorUserId: h.actorUserId,
    createdAt: h.createdAt.toISOString(),
    data: (h.data as Record<string, unknown>) ?? null,
  }));

  return {
    ...serializeProductRequest(
      {
        id: row.id,
        number: row.number,
        userId: row.userId,
        productName: row.productName,
        description: row.description,
        quantity: row.quantity,
        unit: row.unit,
        requiredDate: row.requiredDate,
        contactName: row.contactName,
        contactPhone: row.contactPhone,
        contactEmail: row.contactEmail,
        status: row.status,
        assignedTo: row.assignedTo,
        responseNote: row.responseNote,
        estimatedPriceDirams: row.estimatedPriceDirams,
        estimatedDeliveryDays: row.estimatedDeliveryDays,
        resolvedProductId: row.resolvedProductId,
        version: row.version,
        fingerprint: null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.assigneePhone,
      row.productTitle
    ),
    history,
  };
}

export async function respondProductRequest(
  actor: SessionUser,
  id: string,
  input: unknown,
  ip: string
): Promise<ProductRequestDTO> {
  if (!hasPermission(actor.role, "product_requests:manage")) {
    throw new ApiError(403, "forbidden", "Недостаточно прав для ответа на заявку");
  }
  if (!z.uuid().safeParse(id).success)
    throw new ApiError(404, "not_found", "Заявка не найдена");

  const data = respondProductRequestSchema.parse(input);
  const db = await getDb();

  return await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(productRequests)
      .where(eq(productRequests.id, id))
      .limit(1);

    if (!current) {
      throw new ApiError(404, "not_found", "Заявка не найдена");
    }

    // Optimistic concurrency check
    if (current.version !== data.version) {
      throw new ApiError(
        409,
        "version_conflict",
        "Заявка была изменена другим сотрудником. Обновите страницу для получения актуальных данных.",
        {
          currentVersion: String(current.version),
          currentStatus: current.status,
        }
      );
    }

    // Validate state transition
    assertValidManagerTransition(
      current.status as ProductRequestStatus,
      data.status as ProductRequestStatus
    );

    // If resolvedProductId is provided, verify it exists and is not deleted
    if (data.resolvedProductId) {
      const [product] = await tx
        .select({ id: products.id })
        .from(products)
        .where(
          and(
            eq(products.id, data.resolvedProductId),
            sql`${products.status} != 'ARCHIVED'`
          )
        )
        .limit(1);

      if (!product) {
        throw new ApiError(400, "product_not_found", "Привязанный товар не найден в каталоге или удалён");
      }
    }

    // Determine assignee
    let newAssignee = current.assignedTo;
    if (data.assignedTo && data.assignedTo !== current.assignedTo) {
      // Reassignment allowed for administrators
      const canReassign = actor.role === "ADMIN" || actor.role === "SUPER_ADMIN";
      if (!canReassign) {
        throw new ApiError(403, "forbidden", "Переназначение ответственного доступно только администраторам");
      }
      const [targetUser] = await tx
        .select({ id: users.id, role: users.role, status: users.status })
        .from(users)
        .where(eq(users.id, data.assignedTo))
        .limit(1);

      if (!targetUser || targetUser.status !== "ACTIVE") {
        throw new ApiError(400, "invalid_assignee", "Назначенный сотрудник не найден или заблокирован");
      }
      if (!hasPermission(targetUser.role as Role, "product_requests:manage")) {
        throw new ApiError(400, "invalid_assignee_role", "Указанный пользователь не имеет прав обработки заявок");
      }
      newAssignee = targetUser.id;
    } else if (!newAssignee) {
      // First manager responding claims ownership
      newAssignee = actor.id;
    }

    const estimatedPrice = data.estimatedPriceDirams ? BigInt(data.estimatedPriceDirams) : null;
    const resolvedProduct = data.status === "AVAILABLE" ? (data.resolvedProductId || null) : null;

    const [updated] = await tx
      .update(productRequests)
      .set({
        status: data.status,
        responseNote: data.responseNote ?? null,
        estimatedPriceDirams: estimatedPrice,
        estimatedDeliveryDays: data.estimatedDeliveryDays ?? null,
        resolvedProductId: resolvedProduct,
        assignedTo: newAssignee,
        version: sql`${productRequests.version} + 1`,
        updatedAt: new Date(),
      })
      .where(and(eq(productRequests.id, id), eq(productRequests.version, data.version)))
      .returning();

    if (!updated) {
      throw new ApiError(
        409,
        "version_conflict",
        "Заявка была изменена другим сотрудником. Обновите страницу."
      );
    }

    await writeAudit(tx, {
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "product_request.responded",
      entity: "product_requests",
      entityId: id,
      data: {
        previousStatus: current.status,
        newStatus: data.status,
        previousAssignedTo: current.assignedTo,
        newAssignedTo: newAssignee,
      },
      ip,
    });

    let productTitle = null;
    if (updated.resolvedProductId) {
      const [prod] = await tx
        .select({ title: products.nameRu })
        .from(products)
        .where(eq(products.id, updated.resolvedProductId))
        .limit(1);
      productTitle = prod?.title ?? null;
    }

    let assigneePhone = null;
    if (updated.assignedTo) {
      const [u] = await tx
        .select({ phone: users.phone })
        .from(users)
        .where(eq(users.id, updated.assignedTo))
        .limit(1);
      assigneePhone = u?.phone ?? null;
    }

    return serializeProductRequest(updated, assigneePhone, productTitle);
  });
}

export async function listOwnRequests(
  userId: string,
  query: ListOwnRequestsQuery = {}
): Promise<ListOwnRequestsResponse> {
  const db = await getDb();
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 25));
  const offset = (page - 1) * pageSize;

  const whereClause = eq(productRequests.userId, userId);

  const [totalRow] = await db
    .select({ count: count() })
    .from(productRequests)
    .where(whereClause);
  const total = Number(totalRow?.count ?? 0);

  const rows = await db
    .select({
      id: productRequests.id,
      number: productRequests.number,
      productName: productRequests.productName,
      description: productRequests.description,
      quantity: productRequests.quantity,
      unit: productRequests.unit,
      requiredDate: productRequests.requiredDate,
      status: productRequests.status,
      responseNote: productRequests.responseNote,
      estimatedPriceDirams: productRequests.estimatedPriceDirams,
      estimatedDeliveryDays: productRequests.estimatedDeliveryDays,
      resolvedProductId: productRequests.resolvedProductId,
      version: productRequests.version,
      createdAt: productRequests.createdAt,
      updatedAt: productRequests.updatedAt,
      productTitle: products.nameRu,
      productSlug: products.slug,
    })
    .from(productRequests)
    .leftJoin(products, eq(productRequests.resolvedProductId, products.id))
    .where(whereClause)
    .orderBy(desc(productRequests.createdAt))
    .limit(pageSize)
    .offset(offset);

  const items: CustomerProductRequestDTO[] = rows.map((r) => ({
    id: r.id,
    number: r.number,
    productName: r.productName,
    description: r.description,
    quantity: r.quantity,
    unit: r.unit,
    requiredDate: r.requiredDate,
    status: r.status as ProductRequestStatus,
    responseNote: r.responseNote,
    estimatedPriceDirams: r.estimatedPriceDirams !== null ? r.estimatedPriceDirams.toString() : null,
    estimatedDeliveryDays: r.estimatedDeliveryDays,
    resolvedProductId: r.resolvedProductId,
    resolvedProductTitle: r.productTitle ?? null,
    resolvedProductSlug: r.productSlug ?? null,
    version: r.version,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return { items, total, page, pageSize };
}

export async function getOwnRequest(
  userId: string,
  id: string
): Promise<CustomerProductRequestDTO> {
  if (!z.uuid().safeParse(id).success)
    throw new ApiError(404, "not_found", "Заявка не найдена");
  const db = await getDb();
  const [row] = await db
    .select({
      id: productRequests.id,
      number: productRequests.number,
      productName: productRequests.productName,
      description: productRequests.description,
      quantity: productRequests.quantity,
      unit: productRequests.unit,
      requiredDate: productRequests.requiredDate,
      status: productRequests.status,
      responseNote: productRequests.responseNote,
      estimatedPriceDirams: productRequests.estimatedPriceDirams,
      estimatedDeliveryDays: productRequests.estimatedDeliveryDays,
      resolvedProductId: productRequests.resolvedProductId,
      version: productRequests.version,
      createdAt: productRequests.createdAt,
      updatedAt: productRequests.updatedAt,
      productTitle: products.nameRu,
      productSlug: products.slug,
    })
    .from(productRequests)
    .leftJoin(products, eq(productRequests.resolvedProductId, products.id))
    .where(and(eq(productRequests.id, id), eq(productRequests.userId, userId)))
    .limit(1);

  if (!row) {
    throw new ApiError(404, "not_found", "Заявка не найдена");
  }

  return {
    id: row.id,
    number: row.number,
    productName: row.productName,
    description: row.description,
    quantity: row.quantity,
    unit: row.unit,
    requiredDate: row.requiredDate,
    status: row.status as ProductRequestStatus,
    responseNote: row.responseNote,
    estimatedPriceDirams: row.estimatedPriceDirams !== null ? row.estimatedPriceDirams.toString() : null,
    estimatedDeliveryDays: row.estimatedDeliveryDays,
    resolvedProductId: row.resolvedProductId,
    resolvedProductTitle: row.productTitle ?? null,
    resolvedProductSlug: row.productSlug ?? null,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function cancelOwnRequest(
  userId: string,
  id: string,
  input: unknown,
  ip: string
): Promise<CustomerProductRequestDTO> {
  if (!z.uuid().safeParse(id).success)
    throw new ApiError(404, "not_found", "Заявка не найдена");
  const data = customerCancelSchema.parse(input);
  const db = await getDb();

  return await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(productRequests)
      .where(and(eq(productRequests.id, id), eq(productRequests.userId, userId)))
      .limit(1);

    if (!current) {
      throw new ApiError(404, "not_found", "Заявка не найдена");
    }

    if (current.version !== data.version) {
      throw new ApiError(
        409,
        "version_conflict",
        "Заявка была обновлена. Пожалуйста, обновите страницу."
      );
    }

    assertValidCustomerCancel(current.status as ProductRequestStatus);

    const [updated] = await tx
      .update(productRequests)
      .set({
        status: "CANCELLED",
        version: sql`${productRequests.version} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(productRequests.id, id),
          eq(productRequests.userId, userId),
          eq(productRequests.version, data.version)
        )
      )
      .returning();

    if (!updated) {
      throw new ApiError(409, "version_conflict", "Конфликт версии при отмене заявки.");
    }

    await writeAudit(tx, {
      actorUserId: userId,
      actorRole: "CUSTOMER",
      action: "product_request.cancelled",
      entity: "product_requests",
      entityId: id,
      data: {
        previousStatus: current.status,
        reason: data.reason ?? null,
      },
      ip,
    });

    return {
      id: updated.id,
      number: updated.number,
      productName: updated.productName,
      description: updated.description,
      quantity: updated.quantity,
      unit: updated.unit,
      requiredDate: updated.requiredDate,
      status: "CANCELLED",
      responseNote: updated.responseNote,
      estimatedPriceDirams: updated.estimatedPriceDirams !== null ? updated.estimatedPriceDirams.toString() : null,
      estimatedDeliveryDays: updated.estimatedDeliveryDays,
      resolvedProductId: updated.resolvedProductId,
      resolvedProductTitle: null,
      resolvedProductSlug: null,
      version: updated.version,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  });
}

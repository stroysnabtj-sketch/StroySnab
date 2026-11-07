import { ApiError } from "@/server/api-error";
import type { ProductRequestStatus } from "./types";

export function assertValidManagerTransition(
  currentStatus: ProductRequestStatus,
  targetStatus: ProductRequestStatus
): void {
  if (targetStatus === "NEW" || targetStatus === "CANCELLED") {
    throw new ApiError(
      400,
      "invalid_status_transition",
      `Менеджер не может перевести заявку в статус ${targetStatus}`
    );
  }

  if (currentStatus === "CANCELLED") {
    throw new ApiError(
      400,
      "request_cancelled",
      "Заявка была отменена покупателем и не может быть изменена"
    );
  }

  const allowedTargets: Record<ProductRequestStatus, ProductRequestStatus[]> = {
    NEW: ["IN_REVIEW", "AVAILABLE", "UNAVAILABLE"],
    IN_REVIEW: ["IN_REVIEW", "AVAILABLE", "UNAVAILABLE"],
    AVAILABLE: ["IN_REVIEW", "AVAILABLE", "UNAVAILABLE"],
    UNAVAILABLE: ["IN_REVIEW", "AVAILABLE", "UNAVAILABLE"],
    CANCELLED: [],
  };

  if (!allowedTargets[currentStatus]?.includes(targetStatus)) {
    throw new ApiError(
      400,
      "invalid_status_transition",
      `Недопустимый переход из ${currentStatus} в ${targetStatus}`
    );
  }
}

export function assertValidCustomerCancel(currentStatus: ProductRequestStatus): void {
  if (currentStatus === "CANCELLED") {
    throw new ApiError(400, "already_cancelled", "Заявка уже отменена");
  }

  if (currentStatus === "AVAILABLE" || currentStatus === "UNAVAILABLE") {
    throw new ApiError(
      400,
      "cannot_cancel_responded",
      "Нельзя отменить заявку, по которой уже получен ответ"
    );
  }

  if (currentStatus !== "NEW" && currentStatus !== "IN_REVIEW") {
    throw new ApiError(
      400,
      "cannot_cancel",
      `Отмена заявки в статусе ${currentStatus} недопустима`
    );
  }
}


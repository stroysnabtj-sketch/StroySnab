import type { Role } from "@/modules/rbac/permissions";
export const ROLE_LABELS: Record<Role, string> = {
  GUEST: "Гость",
  CUSTOMER: "Покупатель",
  SUPPLIER_OWNER: "Владелец магазина",
  SUPPLIER_STAFF: "Сотрудник магазина",
  SALES_MANAGER: "Менеджер продаж",
  PROCUREMENT_MANAGER: "Менеджер закупок",
  LOGISTICS: "Логист",
  CONTENT_MANAGER: "Контент-менеджер",
  ADMIN: "Администратор",
  SUPER_ADMIN: "Супер-администратор",
};
export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Черновик",
  PENDING: "На модерации",
  PUBLISHED: "Опубликован",
  REJECTED: "Отклонён",
  ARCHIVED: "В архиве",
};
export const SHOP_STATUS_LABELS: Record<string, string> = {
  PENDING: "Ожидает подключения",
  ACTIVE: "Активен",
  SUSPENDED: "Приостановлен",
};

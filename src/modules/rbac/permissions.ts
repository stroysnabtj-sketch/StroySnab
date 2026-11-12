export const ROLES = [
  "GUEST",
  "CUSTOMER",
  "SUPPLIER_OWNER",
  "SUPPLIER_STAFF",
  "SALES_MANAGER",
  "PROCUREMENT_MANAGER",
  "LOGISTICS",
  "CONTENT_MANAGER",
  "ADMIN",
  "SUPER_ADMIN",
] as const;
export type Role = (typeof ROLES)[number];
export const PERMISSIONS = [
  "catalog:read",
  "catalog:manage",
  "catalog:moderate",
  "suppliers:manage",
  "pricing:manage",
  "orders:read",
  "orders:manage",
  "customers:read",
  "product_requests:manage",
  "fleet:read",
  "fleet:manage",
  "deliveries:manage",
  "deliveries:assign",
  "deliveries:override_conflict",
  "users:manage",
  "admins:manage",
  "audit:read",
  "settings:manage",
  "seller:products",
  "seller:offers",
  "seller:orders",
  "seller:requests",
  "seller:team",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const roleMap: Record<Role, readonly Permission[]> = {
  GUEST: ["catalog:read"],
  CUSTOMER: ["catalog:read"],
  SUPPLIER_OWNER: [],
  SUPPLIER_STAFF: [],
  SALES_MANAGER: [
    "catalog:read",
    "orders:read",
    "orders:manage",
    "customers:read",
    "product_requests:manage",
    "deliveries:manage",
    "fleet:read",
  ],
  PROCUREMENT_MANAGER: [
    "catalog:read",
    "suppliers:manage",
    "pricing:manage",
    "product_requests:manage",
    "deliveries:manage",
    "fleet:read",
  ],
  LOGISTICS: [
    "catalog:read",
    "fleet:read",
    "fleet:manage",
    "deliveries:manage",
    "deliveries:assign",
  ],
  CONTENT_MANAGER: ["catalog:read", "catalog:manage", "catalog:moderate"],
  ADMIN: [...PERMISSIONS.filter((p) => p !== "admins:manage" && !p.startsWith("seller:"))],
  SUPER_ADMIN: [...PERMISSIONS],
};
export function hasPermission(role: Role, permission: Permission): boolean {
  return roleMap[role].includes(permission);
}
export function isStaff(role: Role): boolean {
  return !["GUEST", "CUSTOMER", "SUPPLIER_OWNER", "SUPPLIER_STAFF"].includes(role);
}
export function permissionsForRole(role: Role): readonly Permission[] {
  return roleMap[role];
}

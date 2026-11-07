import { redirect } from "next/navigation";
import { getCurrentUser, type SessionUser } from "./session";
import { hasPermission, type Permission, type Role } from "@/modules/rbac/permissions";

export async function requirePageUser(roles?: Role[], next = "/account"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(next)}`);
  if (roles && !roles.includes(user.role)) redirect("/access-denied");
  return user;
}

export async function requirePagePermission(
  permission: Permission,
  next: string,
): Promise<SessionUser> {
  const user = await requirePageUser(undefined, next);
  if (!hasPermission(user.role, permission)) redirect("/access-denied");
  return user;
}

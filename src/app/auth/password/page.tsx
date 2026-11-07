import { notFound } from "next/navigation";
import { AuthPage } from "@/components/auth/auth-page";
export const metadata = { title: "Вход по паролю" };
export default async function PasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const legacyPasswordEnabled =
    process.env.NODE_ENV !== "production" || process.env.AUTH_LEGACY_PASSWORD_LOGIN === "true";
  if (!legacyPasswordEnabled && process.env.AUTH_ADMIN_PASSWORD_LOGIN !== "true") notFound();
  const next = (await searchParams).next ?? (legacyPasswordEnabled ? undefined : "/admin");
  return <AuthPage mode="login" passwordLogin next={next} />;
}

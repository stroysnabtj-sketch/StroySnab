import { notFound } from "next/navigation";
import { AuthPage } from "@/components/auth/auth-page";
export const metadata = { title: "Вход по паролю" };
export default async function PasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (process.env.NODE_ENV === "production" && process.env.AUTH_LEGACY_PASSWORD_LOGIN !== "true")
    notFound();
  return <AuthPage mode="login" passwordLogin next={(await searchParams).next} />;
}

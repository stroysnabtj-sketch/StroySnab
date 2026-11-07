import { AuthPage } from "@/components/auth/auth-page";
export const metadata = { title: "Вход по паролю" };
export default async function PasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = (await searchParams).next ?? "/admin";
  return <AuthPage mode="login" passwordLogin next={next} />;
}

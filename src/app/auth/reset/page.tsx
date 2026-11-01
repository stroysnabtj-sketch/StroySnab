import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/auth-page";
export const metadata: Metadata = { title: "Новый пароль" };
export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) { const { token } = await searchParams; return <AuthPage mode="reset" token={token ?? ""} />; }

import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/auth-page";
export const metadata: Metadata = { title: "Регистрация" };
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) { const { ref } = await searchParams; return <AuthPage mode="register" refCode={ref ?? ""} />; }

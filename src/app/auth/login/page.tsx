import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/auth-page";
export const metadata: Metadata = { title: "Вход" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) { const { next } = await searchParams; return <AuthPage mode="login" next={next} />; }

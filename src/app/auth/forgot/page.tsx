import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/auth-page";
export const metadata: Metadata = { title: "Восстановление пароля" };
export default function ForgotPage() { return <AuthPage mode="forgot" />; }

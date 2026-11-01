import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AuthForm } from "./auth-form";
import { t } from "@/i18n";
export function AuthPage({ mode, next, refCode, token }: { mode: "login" | "register" | "forgot" | "reset"; next?: string; refCode?: string; token?: string }) {
  const titleKey = mode === "login" ? "auth.loginTitle" : mode === "register" ? "auth.registerTitle" : mode === "forgot" ? "auth.forgotTitle" : "auth.resetTitle";
  return <><SiteHeader /><main className="auth-layout shell"><section className="auth-intro"><span className="eyebrow">KUSHONIYON / STROYHUB.TJ</span><h1>{t(titleKey)}</h1><p>{mode === "register" ? "Единый кабинет для заказов, заявок, адресов и реферальной ссылки." : "Управляйте заказами и отслеживайте статусы в одном месте."}</p></section><section className="auth-card"><AuthForm mode={mode} next={next} refCode={refCode} token={token} /><div className="auth-switch">{mode === "login" ? <Link href="/auth/register">{t("auth.noAccount")}</Link> : mode === "register" ? <Link href="/auth/login">{t("auth.hasAccount")}</Link> : <Link href="/auth/login">{t("auth.hasAccount")}</Link>}</div></section></main><SiteFooter /></>;
}

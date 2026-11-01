"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Checkbox, Field, Input } from "@/components/ui";
import { t } from "@/i18n";

type Mode = "login" | "register" | "forgot" | "reset";
export function AuthForm({ mode, next = "/account", refCode = "", token = "" }: { mode: Mode; next?: string; refCode?: string; token?: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", identifier: "", password: "" });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [developmentToken, setDevelopmentToken] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (key: keyof typeof form, value: string) => setForm((old) => ({ ...old, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setErrors({}); setMessage("");
    if (mode === "register" && !terms) { setErrors({ termsAccepted: t("auth.termsRequired") }); setLoading(false); return; }
    const endpoint = mode === "register" ? "register" : mode === "login" ? "login" : mode === "forgot" ? "forgot" : "reset";
    const body = mode === "register" ? { fullName: form.fullName, phone: form.phone, email: form.email, password: form.password, termsAccepted: terms, refCode } : mode === "login" ? { identifier: form.identifier, password: form.password } : mode === "forgot" ? { email: form.email } : { token, password: form.password };
    try {
      const response = await fetch(`/api/auth/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) { setErrors(result.error?.fields ?? { root: result.error?.message ?? t("common.error") }); return; }
      if (mode === "forgot") { setMessage(t("auth.resetSent")); setDevelopmentToken(result.developmentToken ?? ""); return; }
      if (mode === "reset") { setMessage(t("auth.resetDone")); setTimeout(() => router.push("/auth/login"), 700); return; }
      const destination = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
      router.push(mode === "login" && result.role !== "CUSTOMER" && next === "/account" ? result.role.startsWith("SUPPLIER") ? "/seller" : "/admin" : destination);
      router.refresh();
    } catch { setErrors({ root: t("common.error") }); }
    finally { setLoading(false); }
  }

  function demo(role: "admin" | "customer") {
    setForm((old) => ({ ...old, identifier: role === "admin" ? "admin@stroyhub.tj" : "client@example.com", password: role === "admin" ? "Admin123!" : "Client123!" }));
  }

  return <form className="auth-form" onSubmit={submit} noValidate>
    {errors.root ? <div className="form-alert" role="alert">{errors.root}</div> : null}
    {message ? <div className="form-success" role="status">{message}</div> : null}
    {mode === "register" ? <Field label={t("auth.fullName")} error={errors.fullName}><Input required aria-required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} autoComplete="name" /></Field> : null}
    {mode === "login" ? <Field label={t("auth.identifier")} error={errors.identifier}><Input required value={form.identifier} onChange={(e) => set("identifier", e.target.value)} autoComplete="username" /></Field> : null}
    {mode === "register" ? <><Field label={t("common.phone")} error={errors.phone}><Input required aria-required type="tel" placeholder="+992 xx xxx xx xx" value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" /></Field><Field label={t("auth.emailOptional")} error={errors.email}><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" /></Field></> : null}
    {mode === "forgot" ? <Field label={t("common.email")} error={errors.email}><Input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" /></Field> : null}
    {mode !== "forgot" ? <Field label={t("common.password")} error={errors.password} hint={mode === "register" || mode === "reset" ? t("auth.passwordHint") : undefined}><Input required type="password" value={form.password} onChange={(e) => set("password", e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} /></Field> : null}
    {mode === "register" ? <div><Checkbox checked={terms} onChange={(e) => setTerms(e.target.checked)} aria-describedby="terms-error" label={<span>{t("auth.termsPrefix")}<Link className="inline-link" href="/terms" target="_blank" rel="noopener noreferrer">{t("auth.termsLink")}</Link></span>} />{errors.termsAccepted ? <span className="field-error" id="terms-error" role="alert">{errors.termsAccepted}</span> : null}</div> : null}
    <Button type="submit" disabled={loading}>{loading ? t("common.loading") : t(mode === "login" ? "auth.loginAction" : mode === "register" ? "auth.registerAction" : mode === "forgot" ? "auth.forgotAction" : "auth.resetAction")}</Button>
    {mode === "login" ? <><Link className="auth-secondary-link" href="/auth/forgot">{t("auth.forgot")}</Link><div className="demo-logins"><span className="eyebrow">{t("auth.demo")}</span><div><Button type="button" variant="secondary" onClick={() => demo("admin")}>{t("auth.demoAdmin")}</Button><Button type="button" variant="secondary" onClick={() => demo("customer")}>{t("auth.demoCustomer")}</Button></div></div></> : null}
    {developmentToken ? <Link className="text-link" href={`/auth/reset?token=${developmentToken}`}>Открыть ссылку восстановления</Link> : null}
  </form>;
}

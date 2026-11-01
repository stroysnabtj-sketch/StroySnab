"use client";
import Link from "next/link";
import { useState } from "react";
import { Button, Field, Input } from "@/components/ui";
export function InvitationForm({ code }: { code: string }) {
  const [form, setForm] = useState({ phone: "", email: "", password: "" }); const [message, setMessage] = useState(""); const [ok, setOk] = useState(false); const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent) { event.preventDefault(); setPending(true); const response = await fetch("/api/supplier-invitations/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, code }) }); const result = await response.json(); setPending(false); if (response.ok) setOk(true); else setMessage(result.error?.message ?? "Не удалось принять приглашение"); }
  if (ok) return <div className="request-success"><h2>Вы в команде</h2><p>Аккаунт сотрудника создан. Войдите, чтобы открыть кабинет поставщика.</p><Link className="button button-primary" href="/auth/login?next=/seller">Войти</Link></div>;
  return <form className="stack-form" onSubmit={submit}><Field label="Телефон"><Input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field><Field label="E-mail"><Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field><Field label="Пароль" hint="Не менее 8 символов"><Input required type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>{message && <div className="form-alert" role="alert">{message}</div>}<Button type="submit" loading={pending}>Принять приглашение</Button></form>;
}

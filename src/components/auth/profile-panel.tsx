"use client";
import { useEffect, useState } from "react";
import { Button, DataTable, Field, Input } from "@/components/ui";
import { t, formatDateTime } from "@/i18n";
type Session = { id: string; ip: string | null; userAgent: string | null; createdAt: string; expiresAt: string };
export function ProfilePanel({ initialName, initialPhone }: { initialName: string; initialPhone: string }) {
  const [fullName, setFullName] = useState(initialName); const [phone, setPhone] = useState(initialPhone); const [message, setMessage] = useState(""); const [sessions, setSessions] = useState<Session[]>([]);
  async function load() { const response = await fetch("/api/auth/sessions"); if (response.ok) { const data = await response.json(); setSessions(data.items); } }
  useEffect(() => { void load(); }, []);
  return <div className="account-grid"><section className="card"><h2>{t("account.profile")}</h2><form className="stack-form" onSubmit={async (event) => { event.preventDefault(); const response = await fetch("/api/account/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName, phone }) }); const result = await response.json(); setMessage(response.ok ? t("account.profileSaved") : result.error?.message ?? t("common.error")); }}><Field label={t("auth.fullName")}><Input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></Field><Field label={t("common.phone")}><Input value={phone} onChange={(e) => setPhone(e.target.value)} required /></Field><Button type="submit">{t("account.saveProfile")}</Button>{message ? <p role="status">{message}</p> : null}</form></section><section><h2>{t("account.sessions")}</h2><DataTable headers={["Создана", "Устройство", "IP", t("common.actions")]}>{sessions.map((session) => <tr key={session.id}><td>{formatDateTime(session.createdAt)}</td><td>{session.userAgent?.slice(0, 60) ?? "—"}</td><td className="mono">{session.ip ?? "—"}</td><td><Button variant="ghost" onClick={async () => { await fetch(`/api/auth/sessions/${session.id}`, { method: "DELETE" }); setMessage(t("account.revoked")); await load(); }}>{t("account.revoke")}</Button></td></tr>)}</DataTable></section></div>;
}

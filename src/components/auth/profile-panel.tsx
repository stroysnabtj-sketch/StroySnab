"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Monitor, ShieldCheck, UserRound } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { t, formatDateTime } from "@/i18n";
import styles from "@/components/account.module.css";

type Session = {
  id: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
};
export function ProfilePanel({
  initialName,
  initialPhone,
}: {
  initialName: string;
  initialPhone: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [revoking, setRevoking] = useState<string | null>(null);
  const load = useCallback(async () => {
    setSessionsLoading(true);
    setSessionError("");
    try {
      const response = await fetch("/api/auth/sessions");
      if (!response.ok) throw new Error("Не удалось загрузить устройства.");
      const data = await response.json();
      setSessions(data.items);
    } catch {
      setSessionError("Не удалось загрузить устройства. Попробуйте ещё раз.");
    } finally {
      setSessionsLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <div className={styles.profileGrid}>
      <section className={styles.panel}>
        <div className={styles.panelIcon}>
          <UserRound size={22} aria-hidden="true" />
        </div>
        <h2>Контактные данные</h2>
        <p className={styles.hint}>Используем для связи и оформления заказов.</p>
        <form
          className="stack-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            setMessage("");
            try {
              const response = await fetch("/api/account/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName, phone }),
              });
              const result = await response.json();
              setMessage(
                response.ok
                  ? t("account.profileSaved")
                  : (result.error?.message ?? t("common.error")),
              );
              if (response.ok) router.refresh();
            } catch {
              setMessage("Не удалось сохранить данные. Проверьте соединение и повторите попытку.");
            } finally {
              setSaving(false);
            }
          }}
        >
          <Field label={t("auth.fullName")}>
            <Input
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </Field>
          <Field label={t("common.phone")}>
            <Input
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
            />
          </Field>
          <Button type="submit" loading={saving}>
            {saving ? "Сохраняем…" : t("account.saveProfile")}
          </Button>
          {message && (
            <p className={styles.feedback} role="status">
              {message}
            </p>
          )}
        </form>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelIcon}>
          <ShieldCheck size={22} aria-hidden="true" />
        </div>
        <h2>Устройства и безопасность</h2>
        <p className={styles.hint}>
          Завершите сеанс на устройстве, которым больше не пользуетесь. Завершение текущего сеанса
          потребует повторного входа.
        </p>
        {sessionsLoading ? (
          <p role="status" className={styles.hint}>
            Загружаем устройства…
          </p>
        ) : sessionError ? (
          <div role="alert">
            <p>{sessionError}</p>
            <Button variant="secondary" onClick={() => void load()}>
              Повторить
            </Button>
          </div>
        ) : sessions.length ? (
          <ul className={styles.sessions}>
            {sessions.map((session) => (
              <li key={session.id}>
                <Monitor size={20} aria-hidden="true" />
                <div>
                  <strong title={session.userAgent ?? undefined}>
                    {session.userAgent || "Неизвестное устройство"}
                  </strong>
                  <span>Вход: {formatDateTime(session.createdAt)}</span>
                  <span>IP: {session.ip ?? "не определён"}</span>
                </div>
                <Button
                  variant="ghost"
                  disabled={revoking !== null}
                  onClick={async () => {
                    setRevoking(session.id);
                    setSessionError("");
                    try {
                      const response = await fetch(`/api/auth/sessions/${session.id}`, {
                        method: "DELETE",
                      });
                      if (!response.ok) throw new Error();
                      setMessage(t("account.revoked"));
                      await load();
                      router.refresh();
                    } catch {
                      setSessionError("Не удалось завершить сеанс. Попробуйте ещё раз.");
                    } finally {
                      setRevoking(null);
                    }
                  }}
                >
                  {revoking === session.id ? "Завершаем…" : t("account.revoke")}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.hint}>Активных сеансов нет.</p>
        )}
      </section>
    </div>
  );
}

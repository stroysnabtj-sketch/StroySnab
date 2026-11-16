"use client";
import { useLocale } from "@/i18n/provider";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Monitor, ShieldCheck, UserRound } from "lucide-react";
import { Button, Field, Input, Select } from "@/components/ui";
import { t, formatDateTime } from "@/i18n";
import styles from "@/components/account.module.css";

type Session = {
  id: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
};

function formatUserAgent(ua: string | null): string | null {
  if (!ua) return null;
  const browser = /Edg\//.test(ua)
    ? "Microsoft Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Chrome\/|CriOS\//.test(ua) && !/Chromium/.test(ua)
        ? "Google Chrome"
        : /Firefox\/|FxiOS\//.test(ua)
          ? "Firefox"
          : /Safari\//.test(ua) && !/Chrome/.test(ua)
            ? "Safari"
            : null;
  const os = /iPhone|iPad|iPod/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Windows/.test(ua)
        ? "Windows"
        : /Macintosh|Mac OS X/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : null;
  if (browser && os) return `${browser} · ${os}`;
  if (browser || os) return browser || os;
  return ua;
}

export function ProfilePanel({
  initialName,
  initialPhone,
  initialType = "PERSON",
  initialCompanyName = "",
  initialTaxId = "",
}: {
  initialName: string;
  initialPhone: string;
  initialType?: "PERSON" | "COMPANY";
  initialCompanyName?: string;
  initialTaxId?: string;
}) {
  const { tr } = useLocale();
  const router = useRouter();
  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [customerType, setCustomerType] = useState<"PERSON" | "COMPANY">(initialType);
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [taxId, setTaxId] = useState(initialTaxId);
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
      if (!response.ok) throw new Error(tr("Не удалось загрузить устройства."));
      const data = await response.json();
      setSessions(data.items);
    } catch {
      setSessionError("Не удалось загрузить устройства. Попробуйте ещё раз.");
    } finally {
      setSessionsLoading(false);
    }
  }, [tr]);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <div className={styles.profileGrid}>
      <section className={styles.panel}>
        <div className={styles.panelIcon}>
          <UserRound size={22} aria-hidden="true" />
        </div>
        <h2>{tr("Контактные данные")}</h2>
        <p className={styles.hint}>{tr("Используем для связи и оформления заказов.")}</p>
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
                body: JSON.stringify({
                  fullName,
                  phone,
                  customerType,
                  companyName: customerType === "COMPANY" ? companyName : "",
                  taxId: customerType === "COMPANY" ? taxId : "",
                }),
              });
              const result = await response.json();
              setMessage(
                response.ok
                  ? tr(t("account.profileSaved"))
                  : (result.error?.message ?? tr(t("common.error"))),
              );
              if (response.ok) router.refresh();
            } catch {
              setMessage("Не удалось сохранить данные. Проверьте соединение и повторите попытку.");
            } finally {
              setSaving(false);
            }
          }}
        >
          <Field label={tr("Тип покупателя")}>
            <Select
              value={customerType}
              onChange={(event) =>
                setCustomerType(event.target.value === "COMPANY" ? "COMPANY" : "PERSON")
              }
            >
              <option value="PERSON">{tr("Частное лицо")}</option>
              <option value="COMPANY">{tr("Организация (ООО, ИП)")}</option>
            </Select>
          </Field>
          <Field label={tr(t("auth.fullName"))}>
            <Input
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </Field>
          <Field label={tr(t("common.phone"))}>
            <Input
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
            />
          </Field>
          {customerType === "COMPANY" && (
            <>
              <Field label={tr("Название организации")}>
                <Input
                  maxLength={160}
                  placeholder={tr("ООО или ИП")}
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                />
              </Field>
              <Field label={tr("ИНН / РМА")}>
                <Input
                  maxLength={40}
                  placeholder={tr("Налоговый номер")}
                  value={taxId}
                  onChange={(event) => setTaxId(event.target.value)}
                />
              </Field>
            </>
          )}
          <Button type="submit" loading={saving}>
            {saving ? tr("Сохраняем…") : tr(t("account.saveProfile"))}
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
        <h2>{tr("Устройства и безопасность")}</h2>
        <p className={styles.hint}>
          Завершите сеанс на устройстве, которым больше не пользуетесь. Завершение текущего сеанса
          потребует повторного входа.
        </p>
        {sessionsLoading ? (
          <p role="status" className={styles.hint}>
            {tr("Загружаем устройства…")}
          </p>
        ) : sessionError ? (
          <div role="alert">
            <p>{sessionError}</p>
            <Button variant="secondary" onClick={() => void load()}>
              {tr("Повторить")}
            </Button>
          </div>
        ) : sessions.length ? (
          <ul className={styles.sessions}>
            {sessions.map((session) => (
              <li key={session.id}>
                <Monitor size={20} aria-hidden="true" />
                <div>
                  <strong title={session.userAgent ?? undefined}>
                    {formatUserAgent(session.userAgent) || tr("Неизвестное устройство")}
                  </strong>
                  <span>
                    {tr("Вход:")}
                    {formatDateTime(session.createdAt)}
                  </span>
                  <span>IP: {session.ip ?? tr("не определён")}</span>
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
                      setMessage(tr(t("account.revoked")));
                      await load();
                      router.refresh();
                    } catch {
                      setSessionError("Не удалось завершить сеанс. Попробуйте ещё раз.");
                    } finally {
                      setRevoking(null);
                    }
                  }}
                >
                  {revoking === session.id ? tr("Завершаем…") : tr(t("account.revoke"))}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.hint}>{tr("Активных сеансов нет.")}</p>
        )}
      </section>
    </div>
  );
}

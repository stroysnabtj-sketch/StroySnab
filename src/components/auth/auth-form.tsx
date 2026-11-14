"use client";
import { useLocale } from "@/i18n/provider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Checkbox, Field, Input } from "@/components/ui";
import { t } from "@/i18n";
import { safeAuthDestination } from "@/modules/auth/destination";
import { Eye, EyeOff } from "lucide-react";
import styles from "./auth-experience.module.css";

type Mode = "login" | "register" | "forgot" | "reset";
export function AuthForm({
  mode,
  next = "/account",
  refCode = "",
  token = "",
}: {
  mode: Mode;
  next?: string;
  refCode?: string;
  token?: string;
}) {
  const { tr } = useLocale();
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    identifier: "",
    password: "",
  });
  const [challenge, setChallenge] = useState<{
    challengeId: string;
    maskedRecipient: string;
  } | null>(null);
  const [staffCode, setStaffCode] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [developmentToken, setDevelopmentToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const set = (key: keyof typeof form, value: string) =>
    setForm((old) => ({ ...old, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setErrors({});
    setMessage("");
    if (mode === "register" && !terms) {
      setErrors({ termsAccepted: tr(t("auth.termsRequired")) });
      setLoading(false);
      return;
    }
    if (challenge) {
      try {
        const response = await fetch("/api/auth/code/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ challengeId: challenge.challengeId, code: staffCode }),
        });
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error?.message ?? tr("Не удалось подтвердить вход"));
        const destination = safeAuthDestination(next);
        window.location.href = destination === "/account" ? "/admin" : destination;
      } catch (error) {
        setErrors({ root: (error as Error).message });
      } finally {
        setLoading(false);
      }
      return;
    }
    const endpoint =
      mode === "register"
        ? "register"
        : mode === "login"
          ? "login"
          : mode === "forgot"
            ? "forgot"
            : "reset";
    const body =
      mode === "register"
        ? {
            fullName: form.fullName,
            phone: form.phone,
            email: form.email,
            password: form.password,
            termsAccepted: terms,
            refCode,
          }
        : mode === "login"
          ? {
              identifier: form.identifier,
              password: form.password,
            }
          : mode === "forgot"
            ? { email: form.email }
            : { token, password: form.password };
    try {
      const response = await fetch(`/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) {
        setErrors(result.error?.fields ?? { root: result.error?.message ?? tr(t("common.error")) });
        return;
      }
      if (result.requiresCode && result.challenge) {
        setChallenge(result.challenge);
        setStaffCode("");
        setForm((old) => ({ ...old, password: "" }));
        return;
      }
      if (mode === "forgot") {
        setMessage(tr(t("auth.resetSent")));
        setDevelopmentToken(result.developmentToken ?? "");
        return;
      }
      if (mode === "reset") {
        setMessage(tr(t("auth.resetDone")));
        setTimeout(() => router.push("/auth/login"), 700);
        return;
      }
      const destination = safeAuthDestination(next);
      const target =
        mode === "login" && result.role !== "CUSTOMER" && destination === "/account"
          ? "/admin"
          : destination;
      window.location.href = target;
    } catch {
      setErrors({ root: tr(t("common.error")) });
    } finally {
      setLoading(false);
    }
  }

  if (challenge)
    return (
      <form className={`auth-form ${styles.form}`} onSubmit={submit} aria-busy={loading}>
        <p>
          {tr("Код отправлен на")}
          {challenge.maskedRecipient}
        </p>
        {errors.root && (
          <div className="form-alert" role="alert">
            {errors.root}
          </div>
        )}
        <Field label={tr("Код подтверждения")}>
          <Input
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={staffCode}
            onChange={(event) => setStaffCode(event.target.value.replace(/\D/g, ""))}
          />
        </Field>
        <Button type="submit" disabled={loading || staffCode.length !== 6}>
          {tr("Подтвердить вход")}
        </Button>
        <button
          type="button"
          className="auth-secondary-link"
          disabled={loading}
          onClick={() => {
            setChallenge(null);
            setErrors({});
          }}
        >
          {tr("Войти заново")}
        </button>
      </form>
    );
  return (
    <form className={`auth-form ${styles.form}`} onSubmit={submit} noValidate aria-busy={loading}>
      {errors.root ? (
        <div className="form-alert" role="alert">
          {errors.root}
        </div>
      ) : null}
      {message ? (
        <div className="form-success" role="status">
          {message}
        </div>
      ) : null}
      {mode === "register" ? (
        <Field label={tr(t("auth.fullName"))} error={errors.fullName}>
          <Input
            required
            aria-required
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            autoComplete="name"
          />
        </Field>
      ) : null}
      {mode === "login" ? (
        <Field label={tr(t("auth.identifier"))} error={errors.identifier}>
          <Input
            required
            value={form.identifier}
            onChange={(e) => set("identifier", e.target.value)}
            autoComplete="username"
          />
        </Field>
      ) : null}
      {mode === "register" ? (
        <>
          <Field label={tr(t("common.phone"))} error={errors.phone}>
            <Input
              required
              aria-required
              type="tel"
              placeholder="+992 xx xxx xx xx"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              autoComplete="tel"
            />
          </Field>
          <Field label={tr(t("auth.emailOptional"))} error={errors.email}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              autoComplete="email"
            />
          </Field>
        </>
      ) : null}
      {mode === "forgot" ? (
        <Field label={tr(t("common.email"))} error={errors.email}>
          <Input
            required
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            autoComplete="email"
          />
        </Field>
      ) : null}
      {mode !== "forgot" ? (
        <div className="field">
          <label className="field-label" htmlFor="auth-password">
            {tr(t("common.password"))}
          </label>
          <div className={styles.password}>
            <Input
              id="auth-password"
              required
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password ? "password-error" : mode !== "login" ? "password-hint" : undefined
              }
            />
            <button
              className={styles.reveal}
              type="button"
              aria-label={showPassword ? tr("Скрыть пароль") : tr("Показать пароль")}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
          {errors.password ? (
            <span className="field-error" id="password-error" role="alert">
              {errors.password}
            </span>
          ) : mode !== "login" ? (
            <span className="field-hint" id="password-hint">
              {tr(t("auth.passwordHint"))}
            </span>
          ) : null}
        </div>
      ) : null}
      {mode === "register" ? (
        <div>
          <Checkbox
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            aria-describedby="terms-error"
            label={
              <span>
                {tr(t("auth.termsPrefix"))}
                <Link
                  className="inline-link"
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {tr(t("auth.termsLink"))}
                </Link>{" "}
                {tr("и")}{" "}
                <Link
                  className="inline-link"
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {tr("политикой конфиденциальности")}
                </Link>
              </span>
            }
          />
          {errors.termsAccepted ? (
            <span className="field-error" id="terms-error" role="alert">
              {errors.termsAccepted}
            </span>
          ) : null}
        </div>
      ) : null}
      <Button type="submit" disabled={loading}>
        {loading
          ? tr(t("common.loading"))
          : tr(
              t(
                mode === "login"
                  ? "auth.loginAction"
                  : mode === "register"
                    ? "auth.registerAction"
                    : mode === "forgot"
                      ? "auth.forgotAction"
                      : "auth.resetAction",
              ),
            )}
      </Button>
      {mode === "login" ? (
        <>
          <Link
            className="auth-secondary-link"
            href={`/auth/forgot?next=${encodeURIComponent(safeAuthDestination(next))}`}
          >
            {tr(t("auth.forgot"))}
          </Link>
        </>
      ) : null}
      {developmentToken ? (
        <Link className="text-link" href={`/auth/reset?token=${developmentToken}`}>
          {tr("Открыть ссылку восстановления")}
        </Link>
      ) : null}
    </form>
  );
}

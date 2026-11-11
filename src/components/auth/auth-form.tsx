"use client";
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
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    identifier: "",
    password: "",
  });
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
      setErrors({ termsAccepted: t("auth.termsRequired") });
      setLoading(false);
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
        setErrors(result.error?.fields ?? { root: result.error?.message ?? t("common.error") });
        return;
      }
      if (mode === "forgot") {
        setMessage(t("auth.resetSent"));
        setDevelopmentToken(result.developmentToken ?? "");
        return;
      }
      if (mode === "reset") {
        setMessage(t("auth.resetDone"));
        setTimeout(() => router.push("/auth/login"), 700);
        return;
      }
      const destination = safeAuthDestination(next);
      const target =
        mode === "login" && result.role !== "CUSTOMER" && destination === "/account"
          ? result.role.startsWith("SUPPLIER")
            ? "/seller"
            : "/admin"
          : destination;
      window.location.href = target;
    } catch {
      setErrors({ root: t("common.error") });
    } finally {
      setLoading(false);
    }
  }

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
        <Field label={t("auth.fullName")} error={errors.fullName}>
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
        <Field label={t("auth.identifier")} error={errors.identifier}>
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
          <Field label={t("common.phone")} error={errors.phone}>
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
          <Field label={t("auth.emailOptional")} error={errors.email}>
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
        <Field label={t("common.email")} error={errors.email}>
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
            {t("common.password")}
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
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
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
              {t("auth.passwordHint")}
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
                {t("auth.termsPrefix")}
                <Link
                  className="inline-link"
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("auth.termsLink")}
                </Link>{" "}
                и{" "}
                <Link
                  className="inline-link"
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  политикой конфиденциальности
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
          ? t("common.loading")
          : t(
              mode === "login"
                ? "auth.loginAction"
                : mode === "register"
                  ? "auth.registerAction"
                  : mode === "forgot"
                    ? "auth.forgotAction"
                    : "auth.resetAction",
            )}
      </Button>
      {mode === "login" ? (
        <>
          <Link
            className="auth-secondary-link"
            href={`/auth/forgot?next=${encodeURIComponent(safeAuthDestination(next))}`}
          >
            {t("auth.forgot")}
          </Link>
        </>
      ) : null}
      {developmentToken ? (
        <Link className="text-link" href={`/auth/reset?token=${developmentToken}`}>
          Открыть ссылку восстановления
        </Link>
      ) : null}
    </form>
  );
}

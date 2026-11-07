"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Button, Checkbox, Field, Input } from "@/components/ui";
import styles from "./auth-experience.module.css";
type Challenge = { challengeId: string; maskedRecipient: string; resendAfterSeconds: number };
export function ContactAuthForm({
  mode,
  next = "/account",
  refCode = "",
}: {
  mode: "login" | "register";
  next?: string;
  refCode?: string;
}) {
  const [channel, setChannel] = useState<"sms" | "email">("sms"),
    [identifier, setIdentifier] = useState(""),
    [fullName, setFullName] = useState(""),
    [phone, setPhone] = useState(""),
    [email, setEmail] = useState(""),
    [terms, setTerms] = useState(false),
    [challenge, setChallenge] = useState<Challenge | null>(null),
    [codeStep, setCodeStep] = useState(false),
    [code, setCode] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [waitUntil, setWaitUntil] = useState(0),
    [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!waitUntil) return;
    const update = () => setRemaining(Math.max(0, Math.ceil((waitUntil - Date.now()) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [waitUntil]);
  async function requestCode() {
    if (mode === "register" && !terms) {
      setError("Примите условия соглашения и политику конфиденциальности");
      return;
    }
    setCodeStep(true);
    setBusy(true);
    setError("");
    try {
      const target = mode === "register" ? (channel === "sms" ? phone : email) : identifier;
      const response = await fetch("/api/auth/code/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: mode,
          channel,
          identifier: target,
          ...(mode === "register" ? { fullName, phone, email, termsAccepted: terms, refCode } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        const retry = Number(response.headers.get("Retry-After"));
        if (retry > 0) setWaitUntil(Date.now() + retry * 1000);
        throw new Error(result.error?.message || "Не удалось отправить код");
      }
      setChallenge(result);
      setCode("");
      setWaitUntil(Date.now() + result.resendAfterSeconds * 1000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!codeStep) {
      await requestCode();
      return;
    }
    if (!challenge) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/code/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: challenge.challengeId, code }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Не удалось войти");
      const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
      window.location.href =
        safe === "/account" && result.role !== "CUSTOMER"
          ? result.role.startsWith("SUPPLIER")
            ? "/seller"
            : "/admin"
          : safe;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className={`auth-form ${styles.form}`} onSubmit={submit} aria-busy={busy}>
      {error && (
        <div className="form-alert" role="alert">
          {error}
        </div>
      )}
      {!codeStep ? (
        <>
          <div className={styles.channelTabs} aria-label="Куда отправить код">
            <button
              type="button"
              aria-pressed={channel === "sms"}
              disabled={busy}
              onClick={() => {
                setChannel("sms");
                setIdentifier("");
                setError("");
              }}
            >
              По телефону
            </button>
            <button
              type="button"
              aria-pressed={channel === "email"}
              disabled={busy}
              onClick={() => {
                setChannel("email");
                setIdentifier("");
                setError("");
              }}
            >
              По почте
            </button>
          </div>
          {mode === "register" ? (
            <>
              <Field label="Имя и фамилия">
                <Input
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={120}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={busy}
                />
              </Field>
              <Field label="Телефон">
                <Input
                  type="tel"
                  autoComplete="tel"
                  required
                  placeholder="+992"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={busy}
                />
              </Field>
              <Field label={channel === "email" ? "E-mail" : "E-mail (необязательно)"}>
                <Input
                  type="email"
                  autoComplete="email"
                  required={channel === "email"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={busy}
                />
              </Field>
              <Checkbox
                checked={terms}
                disabled={busy}
                onChange={(e) => setTerms(e.target.checked)}
                label={
                  <span>
                    Принимаю{" "}
                    <Link
                      className="inline-link"
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      условия соглашения
                    </Link>{" "}
                    и{" "}
                    <Link
                      className="inline-link"
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      политику конфиденциальности
                    </Link>
                  </span>
                }
              />
            </>
          ) : (
            <Field label={channel === "sms" ? "Телефон" : "E-mail"}>
              <Input
                type={channel === "sms" ? "tel" : "email"}
                autoComplete={channel === "sms" ? "tel" : "email"}
                placeholder={channel === "sms" ? "+992" : "name@example.com"}
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={busy}
              />
            </Field>
          )}
        </>
      ) : (
        <>
          {challenge && (
            <p className={styles.caption}>
              Код отправлен {channel === "sms" ? "на телефон" : "на почту"}{" "}
              {challenge.maskedRecipient}
            </p>
          )}
          <Field label="Код подтверждения">
            <span className={styles.otpControl}>
              <input
                className={styles.otpInput}
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                required={!!challenge}
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                disabled={busy || !challenge}
              />
              <span className={styles.otpCells} aria-hidden="true">
                {Array.from({ length: 6 }, (_, i) => (
                  <span key={i} data-active={i === Math.min(code.length, 5)}>
                    {code[i] || ""}
                  </span>
                ))}
              </span>
            </span>
          </Field>
        </>
      )}
      <Button
        type="submit"
        disabled={busy || (codeStep ? !challenge || code.length !== 6 : remaining > 0)}
      >
        {busy
          ? "Подождите…"
          : codeStep
            ? mode === "register"
              ? "Создать аккаунт"
              : "Войти"
            : "Получить код"}
      </Button>
      {codeStep && (
        <div className={styles.codeActions}>
          <button
            type="button"
            className="inline-link"
            disabled={busy || remaining > 0}
            onClick={() => void requestCode()}
          >
            {remaining > 0 ? `Повторить через ${remaining} с` : "Отправить код ещё раз"}
          </button>
          <button
            type="button"
            className="inline-link"
            disabled={busy}
            onClick={() => {
              setChallenge(null);
              setCodeStep(false);
              setWaitUntil(0);
              setRemaining(0);
              setCode("");
              setError("");
            }}
          >
            Изменить контакт
          </button>
        </div>
      )}
      {!codeStep && remaining > 0 && (
        <p className={styles.caption} role="status">
          Повторить через {remaining} с
        </p>
      )}
    </form>
  );
}

"use client";
import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, Checkbox, Field, Input } from "@/components/ui";
import { Eye, EyeOff } from "lucide-react";
import {
  registrationPasswordError,
  registrationPasswordHint,
} from "@/modules/auth/registration-password";
import { safeAuthDestination } from "@/modules/auth/destination";
import styles from "./auth-experience.module.css";
type Challenge = { challengeId: string; maskedRecipient: string; resendAfterSeconds: number };
type Turnstile = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
const turnstile = () => (window as Window & { turnstile?: Turnstile }).turnstile;
export function ContactAuthForm({
  mode,
  next = "/account",
  refCode = "",
  captchaSiteKey,
}: {
  mode: "login" | "register" | "recover";
  next?: string;
  refCode?: string;
  captchaSiteKey?: string;
}) {
  const [channel, setChannel] = useState<"sms" | "email">("sms"),
    [identifier, setIdentifier] = useState(""),
    [fullName, setFullName] = useState(""),
    [password, setPassword] = useState(""),
    [passwordConfirmation, setPasswordConfirmation] = useState(""),
    [showPasswords, setShowPasswords] = useState(false),
    [terms, setTerms] = useState(false),
    [challenge, setChallenge] = useState<Challenge | null>(null),
    [codeStep, setCodeStep] = useState(false),
    [code, setCode] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [waitUntil, setWaitUntil] = useState(0),
    [remaining, setRemaining] = useState(0);
  const captchaHost = useRef<HTMLDivElement>(null);
  const captchaId = useRef<string | null>(null);
  const [captchaReady, setCaptchaReady] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const needsCaptcha = !!captchaSiteKey && (mode !== "login" || channel === "sms");
  useEffect(() => {
    const api = turnstile();
    if (!captchaReady || !needsCaptcha || !captchaSiteKey || !captchaHost.current || !api) return;
    const id = api.render(captchaHost.current, {
      sitekey: captchaSiteKey,
      action: "contact_code",
      callback: setCaptchaToken,
      "expired-callback": () => setCaptchaToken(""),
      "error-callback": () => setCaptchaToken(""),
    });
    captchaId.current = id;
    return () => {
      api.remove(id);
      captchaId.current = null;
      setCaptchaToken("");
    };
  }, [captchaReady, needsCaptcha, captchaSiteKey]);
  useEffect(() => {
    if (!waitUntil) return;
    const update = () => setRemaining(Math.max(0, Math.ceil((waitUntil - Date.now()) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [waitUntil]);
  async function requestCode() {
    if (needsCaptcha && !captchaToken) return;
    if (mode === "register" && !terms) {
      setError("Примите условия соглашения и политику конфиденциальности");
      return;
    }
    if (mode !== "login") {
      const passwordError = registrationPasswordError(password, passwordConfirmation);
      if (passwordError) {
        setError(passwordError);
        return;
      }
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/code/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: mode,
          channel,
          identifier,
          ...(needsCaptcha ? { captchaToken } : {}),
          ...(mode === "register" ? { fullName, termsAccepted: terms, refCode } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        const retry = Number(response.headers.get("Retry-After"));
        if (retry > 0) setWaitUntil(Date.now() + retry * 1000);
        throw new Error(result.error?.message || "Не удалось отправить код");
      }
      setChallenge(result);
      setCodeStep(true);
      setCode("");
      setWaitUntil(Date.now() + result.resendAfterSeconds * 1000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      if (needsCaptcha) {
        setCaptchaToken("");
        if (captchaId.current !== null) turnstile()?.reset(captchaId.current);
      }
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
        body: JSON.stringify({
          challengeId: challenge.challengeId,
          code,
          ...(mode !== "login" ? { password, passwordConfirmation } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Не удалось войти");
      const safe = safeAuthDestination(next);
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
          {mode === "register" && (
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
          )}
          <Field label={channel === "sms" ? "Телефон" : "E-mail"}>
            {channel === "sms" ? (
              <span className={styles.phoneInput}>
                <span aria-hidden="true">+992</span>
                <input
                  type="tel"
                  aria-label="Телефон"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="000 00 00 00"
                  pattern="[0-9]{3} [0-9]{2} [0-9]{2} [0-9]{2}"
                  required
                  value={
                    identifier
                      ? [
                          identifier.slice(4, 7),
                          identifier.slice(7, 9),
                          identifier.slice(9, 11),
                          identifier.slice(11, 13),
                        ]
                          .filter(Boolean)
                          .join(" ")
                      : ""
                  }
                  onChange={(e) => {
                    const raw = e.target.value;
                    let digits = raw.replace(/\D/g, "");
                    if (
                      raw.startsWith("+992") ||
                      (digits.length === 12 && digits.startsWith("992"))
                    )
                      digits = digits.slice(3);
                    setIdentifier(digits ? `+992${digits.slice(0, 9)}` : "");
                  }}
                  disabled={busy}
                />
              </span>
            ) : (
              <Input
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={busy}
              />
            )}
          </Field>
          {mode !== "login" && (
            <>
              <div className="field">
                <label className="field-label" htmlFor="registration-password">
                  Пароль
                </label>
                <div className={styles.password}>
                  <Input
                    id="registration-password"
                    type={showPasswords ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    maxLength={72}
                    aria-describedby="registration-password-hint"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={busy}
                  />
                  <button
                    className={styles.reveal}
                    type="button"
                    aria-label={showPasswords ? "Скрыть пароли" : "Показать пароли"}
                    aria-pressed={showPasswords}
                    onClick={() => setShowPasswords(!showPasswords)}
                  >
                    {showPasswords ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
                <span className="field-hint" id="registration-password-hint">
                  {registrationPasswordHint}
                </span>
              </div>
              <Field label="Повторите пароль">
                <Input
                  type={showPasswords ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  maxLength={72}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  disabled={busy}
                />
              </Field>
              {mode === "register" && (
                <Checkbox
                  checked={terms}
                  disabled={busy}
                  onChange={(e) => setTerms(e.target.checked)}
                  label={
                    <span>
                      Согласен с обработкой персональных данных,{" "}
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
              )}
            </>
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
      {needsCaptcha && (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            onReady={() => setCaptchaReady(true)}
            onError={() => setError("Проверка временно недоступна")}
          />
          <div ref={captchaHost} />
        </>
      )}
      <Button
        type="submit"
        disabled={
          busy ||
          (codeStep
            ? !challenge || code.length !== 6
            : remaining > 0 || (mode === "register" && !terms) || (needsCaptcha && !captchaToken))
        }
      >
        {busy
          ? "Подождите…"
          : codeStep
            ? mode === "register"
              ? "Создать аккаунт"
              : mode === "recover"
                ? "Сохранить пароль"
                : "Войти"
            : "Получить код"}
      </Button>
      {codeStep && (
        <div className={styles.codeActions}>
          <button
            type="button"
            className="inline-link"
            disabled={busy || remaining > 0 || (needsCaptcha && !captchaToken)}
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

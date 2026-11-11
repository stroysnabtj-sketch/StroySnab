import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AuthForm } from "./auth-form";
import { ContactAuthForm } from "./contact-auth-form";
import { t } from "@/i18n";
import { safeAuthDestination } from "@/modules/auth/destination";
import styles from "./auth-experience.module.css";
export function AuthPage({
  mode,
  next,
  refCode,
  token,
  passwordLogin = false,
}: {
  mode: "login" | "register" | "forgot" | "reset";
  next?: string;
  refCode?: string;
  token?: string;
  passwordLogin?: boolean;
}) {
  const titleKey =
    mode === "login"
      ? "auth.loginTitle"
      : mode === "register"
        ? "auth.registerTitle"
        : mode === "forgot"
          ? "auth.forgotTitle"
          : "auth.resetTitle";
  const destination = next ? `?next=${encodeURIComponent(safeAuthDestination(next))}` : "";
  const codeLogin = `/auth/login${destination ? `${destination}&` : "?"}method=code`;
  return (
    <>
      <SiteHeader />
      <main className={`shell ${styles.layout}`}>
        <section className={styles.card}>
          <Link href="/" className={styles.authBrand}>
            <span>S</span> STROYSNAB<small>.TJ</small>
          </Link>
          <h1>{t(titleKey)}</h1>
          {!passwordLogin && (mode === "login" || mode === "register" || mode === "forgot") ? (
            <ContactAuthForm
              mode={mode === "forgot" ? "recover" : mode}
              next={next}
              refCode={refCode}
              captchaSiteKey={process.env.TURNSTILE_SITE_KEY}
            />
          ) : (
            <AuthForm mode={mode} next={next} refCode={refCode} token={token} />
          )}
          {mode === "login" && !passwordLogin && (
            <Link className={styles.passwordLink} href={`/auth/password${destination}`}>
              Войти по паролю
            </Link>
          )}
          {passwordLogin && (
            <Link className={styles.passwordLink} href={codeLogin}>
              Войти по коду
            </Link>
          )}
          <div className={styles.switch}>
            {mode === "login" ? (
              <Link href={`/auth/register${destination}`}>Создать аккаунт</Link>
            ) : (
              <Link href={`/auth/login${destination}`}>{t("auth.hasAccount")}</Link>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n/provider";
import { AuthForm } from "./auth-form";
import styles from "./auth-experience.module.css";

export function PasswordEntry({ next, codeLogin }: { next?: string; codeLogin: string }) {
  const { tr } = useLocale();
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <AuthForm mode="login" next={next} onChallengeChange={setConfirming} />
      {!confirming && (
        <Link className={styles.passwordLink} href={codeLogin}>
          {tr("Войти по коду")}
        </Link>
      )}
    </>
  );
}

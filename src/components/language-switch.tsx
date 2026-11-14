"use client";
import { useState } from "react";
import { useLocale } from "@/i18n/provider";
export function LanguageSwitch() {
  const { locale } = useLocale();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  async function change() {
    setPending(true);
    setError(false);
    try {
      const response = await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: locale === "ru" ? "tg" : "ru" }),
      });
      if (!response.ok) throw Error();
      window.location.reload();
    } catch {
      setError(true);
      setPending(false);
    }
  }
  return (
    <>
      <button
        type="button"
        className="language-switch"
        lang={locale === "ru" ? "tg" : "ru"}
        aria-label={locale === "ru" ? "Ба забони тоҷикӣ" : "Переключить на русский"}
        disabled={pending}
        onClick={() => void change()}
      >
        {locale === "ru" ? "Тоҷ" : "Рус"}
      </button>
      {error && (
        <span role="alert" className="sr-only">
          {locale === "ru" ? "Не удалось сменить язык" : "Забон иваз нашуд"}
        </span>
      )}
    </>
  );
}

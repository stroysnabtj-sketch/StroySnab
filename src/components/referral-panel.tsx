"use client";
import { useRef, useState } from "react";
import { Copy, Check, Share2, UsersRound, Link2, Clock3, Gift } from "lucide-react";
import { useLocale } from "@/i18n/provider";
import { formatTJS } from "@/modules/system/money";
import styles from "./referral.module.css";
type Summary = {
  code: string;
  link: string;
  stats: { invited: number; pending: number; credited: number };
  bonusPercent?: string;
  creditedDirams?: string;
};
export function ReferralPanel({
  code,
  link,
  stats,
  bonusPercent = "2",
  creditedDirams = "0",
}: Summary) {
  const { tr, locale } = useLocale();
  const field = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [hint, setHint] = useState("");
  const copiedUntil = useRef(0);
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      const until = Date.now() + 2000;
      copiedUntil.current = until;
      setCopied(true);
      setHint("");
      setTimeout(() => {
        if (copiedUntil.current === until) setCopied(false);
      }, 2000);
    } catch {
      field.current?.focus();
      field.current?.select();
      setHint(tr("Выделите ссылку и скопируйте её вручную"));
    }
  }
  async function share() {
    if (!navigator.share) {
      await copy();
      return;
    }
    try {
      await navigator.share({ title: "StroySnab", text: tr("Приглашение в StroySnab"), url: link });
    } catch (error) {
      if ((error as Error).name !== "AbortError") await copy();
    }
  }
  const cards = [
    { title: "Приглашённых", value: stats.invited, icon: UsersRound },
    { title: "Ожидают начисления", value: stats.pending, icon: Clock3 },
    { title: "Начислений", value: stats.credited, icon: Gift },
  ];
  return (
    <div className={styles.stack}>
      <section className={styles.invitation} aria-labelledby="referral-title">
        <span className={styles.icon}>
          <UsersRound size={24} aria-hidden="true" />
        </span>
        <div>
          <h2 id="referral-title">{tr("Приглашайте друзей и коллег")}</h2>
          <p>
            {tr("Поделитесь личной ссылкой. Приглашение учтётся, когда друг зарегистрируется.")}
          </p>
        </div>
      </section>
      <section className={styles.card} aria-labelledby="referral-link-title">
        <h2 id="referral-link-title">{tr("Ваша ссылка приглашения")}</h2>
        <label htmlFor="referral-link" className="sr-only">
          {tr("Реферальная ссылка")}
        </label>
        <div className={styles.linkRow}>
          <div className={styles.field}>
            <Link2 size={18} aria-hidden="true" />
            <input
              id="referral-link"
              ref={field}
              value={link}
              readOnly
              autoComplete="off"
              spellCheck={false}
              onFocus={(e) => e.target.select()}
            />
          </div>
          <button type="button" className="button button-primary" onClick={copy}>
            {copied ? (
              <Check size={18} aria-hidden="true" />
            ) : (
              <Copy size={18} aria-hidden="true" />
            )}
            {tr(copied ? "Скопировано" : "Скопировать ссылку")}
          </button>
          <button type="button" className="button button-secondary" onClick={share}>
            <Share2 size={18} aria-hidden="true" />
            {tr("Поделиться")}
          </button>
        </div>
        <div className={styles.caption}>
          {tr("Код приглашения")}: <strong>{code}</strong>
        </div>
        <p className={styles.hint} role="status" aria-live="polite">
          {hint || (copied ? tr("Ссылка скопирована") : "")}
        </p>
      </section>
      <div className={styles.stats}>
        {cards.map(({ title, value, icon: Icon }) => (
          <section className={styles.stat} key={title}>
            <Icon size={21} aria-hidden="true" />
            <strong>
              {new Intl.NumberFormat(locale === "tg" ? "tg-TJ" : "ru-RU").format(value)}
            </strong>
            <span>{tr(title)}</span>
          </section>
        ))}
      </div>
      <section className={styles.note}>
        <h2>{tr("Как это работает")}</h2>
        <ol>
          <li>{tr("Отправьте ссылку другу или коллеге.")}</li>
          <li>{tr("После регистрации приглашение появится в вашей статистике.")}</li>
          <li>
            {tr("При первом доставленном заказе друга вам начисляется бонус")}{" "}
            <strong>{bonusPercent}%</strong> {tr("от суммы материалов заказа.")}
          </li>
        </ol>
        <p>
          {tr("Начислено бонусов за всё время")}: <strong>{formatTJS(creditedDirams)}</strong>
        </p>
      </section>
    </div>
  );
}

"use client";
import { useLocale } from "@/i18n/provider";
import Link from "next/link";
import { t } from "@/i18n";

export function SiteFooter() {
  const { tr } = useLocale();
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <Link href="/" className="brand footer-brand">
            <span className="brand-mark">S</span>
            <span>
              STROYSNAB<small>.TJ</small>
            </span>
          </Link>
          <p>{tr(t("footer.note"))}</p>
        </div>
        <div>
          <strong>{tr("Покупателям")}</strong>
          <Link href="/catalog">{tr(t("common.catalog"))}</Link>
          <Link href="/catalog/request">{tr("Заявка на товар")}</Link>
          <Link href="/delivery">{tr(t("common.delivery"))}</Link>
        </div>
        <div>
          <strong>{tr("Документы")}</strong>
          <Link href="/terms">{tr(t("common.terms"))}</Link>
          <Link href="/privacy">{tr(t("common.privacy"))}</Link>
          <Link href="/contacts">{tr(t("common.contacts"))}</Link>
        </div>
        <div>
          <strong>{tr("Связаться")}</strong>
          <a href="tel:+992446000000">+992 44 600 00 00</a>
          <a href="mailto:salom@stroysnab.tj">salom@stroysnab.tj</a>
          <span>{tr("Душанбе · Пн–Сб, 08:00–18:00")}</span>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© {new Date().getFullYear()} Stroysnab.tj</span>
        <span>{tr(t("footer.rights"))}</span>
      </div>
    </footer>
  );
}

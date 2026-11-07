import Link from "next/link";
import { t } from "@/i18n";

export function SiteFooter() {
  return <footer className="site-footer"><div className="shell footer-grid"><div><Link href="/" className="brand footer-brand"><span className="brand-mark">S</span><span>STROYSNAB<small>.TJ</small></span></Link><p>{t("footer.note")}</p></div><div><strong>Покупателям</strong><Link href="/catalog">{t("common.catalog")}</Link><Link href="/catalog/request">Заявка на товар</Link><Link href="/delivery">{t("common.delivery")}</Link></div><div><strong>Документы</strong><Link href="/terms">{t("common.terms")}</Link><Link href="/privacy">{t("common.privacy")}</Link><Link href="/contacts">{t("common.contacts")}</Link></div><div><strong>Связаться</strong><a href="tel:+992446000000">+992 44 600 00 00</a><a href="mailto:salom@stroysnab.tj">salom@stroysnab.tj</a><span>Душанбе · Пн–Сб, 08:00–18:00</span></div></div><div className="shell footer-bottom"><span>© {new Date().getFullYear()} Stroysnab.tj</span><span>{t("footer.rights")}</span></div></footer>;
}

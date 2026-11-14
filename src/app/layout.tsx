import { getLocale } from "@/i18n/server";
import { LocaleProvider } from "@/i18n/provider";
import { headers } from "next/headers";
import { CspNonceProvider } from "@/components/csp-nonce-provider";
import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import { NavigationProgress } from "@/components/navigation-progress";
import { publicSiteOrigin } from "@/modules/system/site-url";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import "./storefront.css";
import "./mobile-header.css";

const body = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-body", display: "swap" });
const mono = IBM_Plex_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(publicSiteOrigin()),
  title: { default: "Stroysnab.tj — стройматериалы в Таджикистане", template: "%s — Stroysnab.tj" },
  description:
    "Строительные материалы от проверенных поставщиков с единым заказом и доставкой по Таджикистану.",
  icons: { icon: "/favicon.svg" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const nonce = (await headers()).get("x-nonce") ?? "";
  return (
    <html lang={locale} className={`${body.variable} ${mono.variable}`}>
      <body>
        <CspNonceProvider nonce={nonce}>
          <LocaleProvider locale={locale}>
            <NavigationProgress />
            {children}
          </LocaleProvider>
        </CspNonceProvider>
      </body>
    </html>
  );
}

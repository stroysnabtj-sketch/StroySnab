import type { Locale } from "@/i18n/types";
import { publicContacts } from "@/modules/system/public-contacts";

const copy = {
  ru: {
    login: "Код входа в StroySnab",
    register: "Код регистрации в StroySnab",
    recover: "Код восстановления доступа к StroySnab",
    instruction: "Введите этот код на сайте StroySnab.",
    validity: (minutes: number) => `Код действует ${minutes} мин.`,
    security: "Никому не сообщайте код. Если вы его не запрашивали, обратитесь в поддержку.",
    support: "Написать в поддержку",
  },
  tg: {
    login: "Рамзи воридшавӣ ба StroySnab",
    register: "Рамзи сабти ном дар StroySnab",
    recover: "Рамзи барқарор кардани дастрасӣ ба StroySnab",
    instruction: "Ин рамзро дар сомонаи StroySnab ворид кунед.",
    validity: (minutes: number) => `Рамз ${minutes} дақиқа эътибор дорад.`,
    security: "Рамзро ба касе нагӯед. Агар онро дархост накарда бошед, ба дастгирӣ муроҷиат кунед.",
    support: "Ба дастгирӣ нависед",
  },
} as const;

export function codeEmail(
  code: string,
  expiresInSeconds: number,
  purpose: "login" | "register" | "recover" = "login",
  locale: Locale = "ru",
) {
  if (!/^\d{6}$/.test(code)) throw new Error("Invalid verification code");
  const messages = copy[locale];
  const subject = messages[purpose];
  const validity = messages.validity(Math.ceil(expiresInSeconds / 60));
  const support = publicContacts.supportEmail;
  return {
    subject,
    text: [subject, messages.instruction, code, validity, messages.security, support].join("\n\n"),
    html: `<!doctype html>
<html lang="${locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;background:#eef3f8;color:#152d49;font-family:Arial,sans-serif">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef3f8">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:16px">
<tr><td align="center" style="padding:20px;background:#102f57;color:#fff;border-radius:16px 16px 0 0;font-size:21px;font-weight:bold"><a href="https://www.stroysnab.tj/" style="color:#ffffff;text-decoration:none"><span style="color:#ffffff">STROYSNAB.TJ</span></a></td></tr>
<tr><td style="padding:28px 24px">
<h1 style="margin:0 0 14px;font-size:23px;line-height:1.3">${subject}</h1>
<p style="margin:0 0 18px;font-size:15px;line-height:1.5">${messages.instruction}</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td align="center" dir="ltr" style="padding:16px 8px;background:#e8f0fa;color:#102f57;border-radius:10px;font-family:Consolas,monospace;font-size:32px;font-weight:bold;letter-spacing:4px">${code}</td></tr>
</table>
<p style="margin:12px 0 18px;font-size:14px">${validity}</p>
<p style="margin:0;font-size:14px;line-height:1.55">${messages.security}</p>
</td></tr>
<tr><td align="center" style="padding:16px 24px;border-top:1px solid #dce4ee;font-size:14px">
<a href="mailto:${support}" style="color:#074089">${messages.support}</a>
</td></tr>
</table></td></tr></table>
</body></html>`,
  };
}

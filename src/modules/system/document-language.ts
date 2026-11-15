import type { Locale } from "@/i18n/types";
import { translate } from "@/i18n/storefront";

const ru = {
  invoice: "Накладная",
  invoiceHeading: "НАКЛАДНАЯ",
  quotation: "КП",
  quotationHeading: "КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ",
  draft: "ЧЕРНОВИК",
  dateFrom: "от",
  recipient: "Получатель",
  phone: "Телефон",
  validUntil: "Действительно до",
  pickup: "Самовывоз",
  deliveryAddress: "Адрес доставки",
  material: "МАТЕРИАЛ",
  quantity: "КОЛ-ВО",
  unit: "ЕД.",
  price: "ЦЕНА / TJS",
  amount: "СУММА / TJS",
  delivery: "Доставка",
  deliveryHeading: "ДОСТАВКА",
  deliveryExcluded: "Не включена",
  deliverySeparate: "Согласуется отдельно",
  total: "ИТОГО",
  totalPayable: "Итого к оплате",
  conditions: "УСЛОВИЯ",
  materialPhotos: "ФОТО МАТЕРИАЛОВ",
  photoUnavailable: "Фото недоступно",
  qrPayment: "ОПЛАТА ПО QR",
  bankQr: "Банковский QR-код",
  qrUnavailable: "Пока недоступен",
};

export type DocumentLabels = Record<keyof typeof ru, string>;

const tg: DocumentLabels = {
  invoice: "Борхат",
  invoiceHeading: "БОРХАТ",
  quotation: "ПТ",
  quotationHeading: "ПЕШНИҲОДИ ТИҶОРАТӢ",
  draft: "ЛОИҲА",
  dateFrom: "аз",
  recipient: "Гиранда",
  phone: "Телефон",
  validUntil: "Эътибор дорад то",
  pickup: "Худбурд",
  deliveryAddress: "Суроғаи расонидан",
  material: "МАСОЛЕҲ",
  quantity: "МИҚДОР",
  unit: "ВОҲ.",
  price: "НАРХ / TJS",
  amount: "ҶАМЪ / TJS",
  delivery: "Расонидан",
  deliveryHeading: "РАСОНИДАН",
  deliveryExcluded: "Дохил нест",
  deliverySeparate: "Алоҳида мувофиқа мешавад",
  total: "ҶАМЪ",
  totalPayable: "Ҷамъ барои пардохт",
  conditions: "ШАРТҲО",
  materialPhotos: "АКСҲОИ МАСОЛЕҲ",
  photoUnavailable: "Акс дастрас нест",
  qrPayment: "ПАРДОХТ БО QR",
  bankQr: "QR-коди бонкӣ",
  qrUnavailable: "Ҳоло дастрас нест",
};

/** Interface labels only: saved product names and legal/quotation terms stay intact. */
export function documentLabels(locale: Locale = "ru"): DocumentLabels {
  return locale === "tg" ? tg : ru;
}

export function documentDate(value: Date | string, locale: Locale = "ru") {
  return new Date(value).toLocaleDateString(locale === "tg" ? "tg-TJ" : "ru-RU", {
    timeZone: "Asia/Dushanbe",
  });
}

/** Reuse the existing exact unit translations; custom/snapshot units are preserved. */
export function documentUnit(unit: string, locale: Locale = "ru") {
  const knownUnits = ["шт.", "м", "м²", "м³", "кг", "т", "упак.", "другое"];
  return knownUnits.includes(unit) ? translate(unit, locale) : unit;
}

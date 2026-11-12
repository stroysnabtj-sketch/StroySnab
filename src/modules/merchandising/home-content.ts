import { z } from "zod";

function localLink(value: string): string {
  if (/^https:\/\/(www\.)?stroysnab\.tj\//i.test(value))
    return new URL(value).pathname + new URL(value).search;
  return value;
}
const link = z
  .string()
  .trim()
  .max(500)
  .transform(localLink)
  .refine(
    (value) => /^\/(?:catalog(?:\?[^\s\\<>]*)?|request|product\/[a-z0-9-]+)$/.test(value),
    "Укажите ссылку на каталог, заявку или товар Stroysnab.tj",
  );
const image = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) =>
      /^\/(?:images\/[a-zA-Z0-9_./-]+\.(?:webp|png|jpg|jpeg)|api\/(?:files|home-images)\/[a-f0-9-]{36})$/.test(
        value,
      ) && !value.includes(".."),
    "Укажите путь к изображению сайта или загруженному файлу",
  );
export const homeContentSchema = z.object({
  hero: z.object({
    title: z.string().trim().min(1).max(100),
    subtitle: z.string().trim().max(200),
    image,
    mobileImage: z.union([z.literal(""), image]).default(""),
    primaryLabel: z.string().trim().min(1).max(35),
    primaryHref: link,
    secondaryLabel: z.string().trim().min(1).max(35),
    secondaryHref: link,
  }),
  ads: z
    .array(
      z.object({
        id: z.uuid(),
        title: z.string().trim().min(1).max(100),
        href: link.refine(
          (value) => /^\/product\/[a-z0-9-]+$/.test(value),
          "Укажите ссылку на товар",
        ),
        image: z.union([z.literal(""), image]),
        mobileImage: z.union([z.literal(""), image]).default(""),
        buttonLabel: z.string().trim().min(1).max(35),
        active: z.boolean(),
      }),
    )
    .max(6)
    .refine(
      (ads) => new Set(ads.map((ad) => ad.id)).size === ads.length,
      "Размещения не должны повторяться",
    ),
});
export type HomeContent = z.infer<typeof homeContentSchema>;
export const defaultHomeContent: HomeContent = {
  hero: {
    title: "Строите?\nНачните\nс материалов.",
    subtitle: "Подберите всё для стройки в каталоге или отправьте список на расчёт.",
    image: "/images/editorial/construction-crane-v2.webp",
    mobileImage: "",
    primaryLabel: "Каталог",
    primaryHref: "/catalog",
    secondaryLabel: "Получить КП",
    secondaryHref: "/request",
  },
  ads: [],
};

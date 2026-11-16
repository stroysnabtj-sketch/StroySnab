export type ProductPhotoKind =
  | "cement"
  | "rebar"
  | "brick"
  | "block"
  | "profile"
  | "roofing"
  | "insulation"
  | "pipe"
  | "cable"
  | "panel"
  | "tool"
  | "paint"
  | "fastener"
  | "garden"
  | "doors"
  | "generic";

export const placeholderPhoto = (kind: ProductPhotoKind) => `/images/catalog/${kind}-v1.webp`;

const JCTOP_CATEGORY_SLUGS = new Set([
  "akkumulyatornyy-instrument",
  "setevoy-elektroinstrument",
  "silovoe-oborudovanie",
  "ruletki-i-izmeritelnye-pribory",
  "klyuchi-i-nabory-golovok",
  "ploskogubtsy-i-kleshchi",
  "molotki-i-kuvaldy",
  "stroitelnyy-ruchnoy-instrument",
  "rezhushchiy-ruchnoy-instrument",
  "sadovyy-instrument",
  "otvyortki-i-nabory-bit",
  "osnastka-i-raskhodniki",
  "germetiki-i-kleyevye-prinadlezhnosti",
  "avtoinstrument-i-remont",
  "zashchitnaya-ekipirovka-i-bezopasnost",
  "svarochnye-prinadlezhnosti",
  "strubtsiny-i-prisoski",
  "reklamnaya-produktsiya",
]);

const rules: [RegExp, ProductPhotoKind][] = [
  [/аккумулятор|электроинструмент|дрель|перфоратор|power-tools|tool/, "tool"],
  [/рулетк|уровень|измерительн/, "tool"],
  [/ключ|головк|плоскогубц|клещ|молоток|кувалд/, "tool"],
  [/нож|пила|диск|сверло|бур|оснастк/, "tool"],
  [/герметик|пена|клей/, "paint"],
  [/домкрат|авто/, "generic"],
  [/экипировк|перчатк|обувь|очки/, "panel"],
  [/сварк|электрод/, "generic"],
  [/струбцин|тиски|присоск/, "tool"],
  [/садов|секатор|кусторез|garden/, "garden"],
  [/профнастил|профлист|roof-sheets|krovelnye-materialy/, "roofing"],
  [/профильн.*труб|труб.*профиль|швеллер|metal-profile/, "profile"],
  [/газоблок|пеноблок|газобетон|блок.*стен|стен.*блок|stroitelnye-bloki/, "block"],
  [/кирпич|kirpich|brick/, "brick"],
  [/арматур|rebar/, "rebar"],
  [/минерал.*ват|утеплител.*минерал|теплоизоляц|mineralnaya-vata|insulation/, "insulation"],
  [/щит|распределит.*шкаф|electrical-panels/, "panel"],
  [/кабел|провод|cable/, "cable"],
  [/саморез|шуруп|болт|анкер|дюбел|гайк|винт|fastener/, "fastener"],
  [/полипропилен|ппр|фитинг|ppr|pipes|fittings/, "pipe"],
  [/краск|эмал|грунтов|paint/, "paint"],
  [/цемент|штукатур|шпатл|шпакл|сух.*смес|смесь.*строит|cement|dry-mixes|shpaklevki/, "cement"],
  [/двер|окон|door|window/, "doors"],
];

export function productPhotoKind(categorySlug = "", name = ""): ProductPhotoKind {
  const normalized = (value: string) => value.toLocaleLowerCase("ru").replaceAll("ё", "е");
  for (const [pattern, kind] of rules) if (pattern.test(normalized(name))) return kind;
  for (const [pattern, kind] of rules) if (pattern.test(normalized(categorySlug))) return kind;
  return "generic";
}

export function categoryPhoto(slug: string, name: string) {
  if (JCTOP_CATEGORY_SLUGS.has(slug)) {
    return `/images/catalog/${slug}.webp`;
  }
  return placeholderPhoto(productPhotoKind(slug, name));
}

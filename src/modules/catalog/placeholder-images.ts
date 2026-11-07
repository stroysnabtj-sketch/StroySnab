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
const rules: [RegExp, ProductPhotoKind][] = [
  [/профнастил|профлист|roof-sheets|krovelnye-materialy/, "roofing"],
  [/профильн.*труб|труб.*профиль|швеллер|metal-profile/, "profile"],
  [/газоблок|пеноблок|газобетон|блок.*стен|стен.*блок|stroitelnye-bloki/, "block"],
  [/кирпич|kirpich|brick/, "brick"],
  [/арматур|rebar/, "rebar"],
  [/минерал.*ват|утеплител.*минерал|теплоизоляц|mineralnaya-vata|insulation/, "insulation"],
  [/щит|распределит.*шкаф|electrical-panels/, "panel"],
  [/кабел|провод|cable/, "cable"],
  [/саморез|шуруп|болт|анкер|дюбел|гайк|винт|fastener/, "fastener"],
  [/перфоратор|отбойн|power-tools/, "tool"],
  [/полипропилен|ппр|фитинг|ppr|pipes|fittings/, "pipe"],
  [/краск|эмал|грунтов|paint/, "paint"],
  [/цемент|штукатур|шпатл|шпакл|сух.*смес|смесь.*строит|cement|dry-mixes|shpaklevki/, "cement"],
  [/секатор|садов|garden/, "garden"],
  [/двер|окон|door|window/, "doors"],
];
export function productPhotoKind(categorySlug = "", name = ""): ProductPhotoKind {
  const normalized = (value: string) => value.toLocaleLowerCase("ru").replaceAll("ё", "е");
  for (const [pattern, kind] of rules) if (pattern.test(normalized(name))) return kind;
  for (const [pattern, kind] of rules) if (pattern.test(normalized(categorySlug))) return kind;
  return "generic";
}
const categoryPhotos: Record<string, ProductPhotoKind> = {
  "building-materials": "cement",
  finishing: "paint",
  elektrotovary: "panel",
  instrumenty: "tool",
  plumbing: "pipe",
  "khoztovary-i-krepezh": "fastener",
  "garden-outdoor": "garden",
  "doors-windows": "doors",
  "cistemy-bezopasnosti": "panel",
  "tekhnika-i-elektronika": "generic",
  "engineering-systems": "pipe",
  "trade-equipment": "generic",
};
export function categoryPhoto(slug: string, name: string) {
  return placeholderPhoto(categoryPhotos[slug] ?? productPhotoKind(slug, name));
}
